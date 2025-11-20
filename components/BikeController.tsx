import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { ControlsState } from '../types';
import { useGameStore } from '../store';
import { BikeVisuals } from './BikeVisuals';

const IDLE_RPM = 1000;
const REDLINE_RPM = 10000;
const BRAKE_FORCE = 25;
const TOP_SPEED = 180;

class SoundEngine {
    ctx: any | null = null;
    osc: any | null = null;
    gain: any | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            try {
                 const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
                 this.ctx = new AudioContext();
                 this.gain = this.ctx.createGain();
                 this.gain.connect(this.ctx.destination);
                 this.gain.gain.value = 0;
            } catch(e) { console.error(e); }
        }
    }

    start() {
        if (!this.ctx || !this.gain) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sawtooth';
        this.osc.connect(this.gain);
        this.osc.start();
    }

    update(rpm: number, load: number) {
        if (!this.osc || !this.gain || !this.ctx) return;
        const baseFreq = 60 + (rpm / 12000) * 150;
        this.osc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
        
        const vol = 0.05 + (load * 0.1) + (rpm / 30000);
        this.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
}

interface BikeProps {
  controls: ControlsState;
  onPositionUpdate: (pos: THREE.Vector3) => void;
}

export const BikeController: React.FC<BikeProps> = ({ controls, onPositionUpdate }) => {
  const { camera } = useThree();
  const updateBikeData = useGameStore(s => s.updateBikeData);
  const bikeConfig = useGameStore(s => s.bikeConfig);
  const terrainDrag = useGameStore(s => s.terrainDrag);
  const terrainTraction = useGameStore(s => s.terrainTraction);
  
  // Physics Body
  const [sphereRef, api] = useSphere(() => ({ 
    mass: 150, 
    position: [0, 2, 0], 
    args: [0.5],
    fixedRotation: true, 
    linearDamping: 0.05,
    material: { friction: 0.05, restitution: 0 },
    name: 'bike-chassis'
  }));

  const engine = useRef({ rpm: 0, gear: 1, speed: 0 });
  const soundEngine = useRef<SoundEngine>(new SoundEngine());
  const [audioStarted, setAudioStarted] = useState(false);
  const velocity = useRef([0, 0, 0]);
  const heading = useRef(0);
  
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

  // Initialize audio on first interaction (browser policy)
  useEffect(() => {
    if ((controls.forward || controls.backward) && !audioStarted) {
        soundEngine.current.start();
        setAudioStarted(true);
    }
  }, [controls, audioStarted]);

  // Reset Logic
  useEffect(() => {
    if (controls.reset) {
        api.position.set(0, 2, 0);
        api.velocity.set(0, 0, 0);
        api.angularVelocity.set(0, 0, 0);
        heading.current = 0;
    }
  }, [controls.reset, api]);

  // Camera smoothing
  const cameraOffset = useRef(new THREE.Vector3(0, 4, -8));
  const cameraLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!sphereRef.current) return;

    const pos = sphereRef.current.position;
    onPositionUpdate(pos);
    
    const velVector = new THREE.Vector3(velocity.current[0], velocity.current[1], velocity.current[2]);
    const speedMs = Math.sqrt(velVector.x**2 + velVector.z**2); 
    const speedKmh = speedMs * 3.6;
    engine.current.speed = speedKmh;

    // Terrain Physics
    let effectiveTraction = terrainTraction;
    let effectiveDrag = terrainDrag;

    if (bikeConfig.tires === 'offroad') {
       if (terrainTraction < 0.8) effectiveTraction += 0.2; 
       if (terrainDrag > 0) effectiveDrag *= 0.6; 
    } else {
       if (terrainTraction < 0.8) effectiveTraction -= 0.1; 
    }

    // Automatic Transmission Logic
    // Simple shift points based on speed
    if (speedKmh < 30) engine.current.gear = 1;
    else if (speedKmh < 60) engine.current.gear = 2;
    else if (speedKmh < 90) engine.current.gear = 3;
    else if (speedKmh < 120) engine.current.gear = 4;
    else engine.current.gear = 5;

    // RPM Logic (Simulated based on gear range)
    const gearMinSpeeds = [0, 0, 30, 60, 90, 120];
    const gearMaxSpeeds = [0, 40, 70, 100, 130, 200];
    const currentMin = gearMinSpeeds[engine.current.gear];
    const currentMax = gearMaxSpeeds[engine.current.gear];
    const range = currentMax - currentMin;
    const ratio = (speedKmh - currentMin) / range;
    
    let targetRpm = IDLE_RPM + (ratio * (REDLINE_RPM - IDLE_RPM));
    if (controls.forward && engine.current.gear === 1 && speedKmh < 10) {
         // Rev up higher when starting
         targetRpm = Math.max(targetRpm, 3000); 
    }
    
    engine.current.rpm = THREE.MathUtils.lerp(engine.current.rpm, Math.max(IDLE_RPM, targetRpm), delta * 5);

    // Movement Logic
    const throttle = controls.forward ? 1 : 0;
    const brake = controls.backward ? 1 : 0; // S acts as brake/reverse
    const handbrake = controls.brake ? 1 : 0;

    // Steering
    if (speedKmh > 0.5) {
        const steerAmt = controls.left ? 1 : controls.right ? -1 : 0;
        // Steering becomes less sensitive at high speed
        const sensitivity = Math.max(0.5, 2.5 - (speedKmh / 80));
        heading.current += steerAmt * delta * sensitivity;
    }

    // Forces
    const forwardDir = new THREE.Vector3(Math.sin(heading.current), 0, Math.cos(heading.current));
    let force = 0;

    // Suspension config
    const powerMult = bikeConfig.suspension === 'stiff' ? 1.1 : 1.0;

    if (throttle && speedKmh < TOP_SPEED) {
        force = 1200 * powerMult * effectiveTraction;
        // Reduce power in high gears roughly
        force -= (engine.current.gear * 50); 
    }

    // Braking (S key)
    if (brake) {
        if (speedKmh > 1) {
            force = -BRAKE_FORCE * 50; // Brakes
        } else {
            force = -300; // Reverse slowly
        }
    }

    // Handbrake (Space)
    if (handbrake) {
        force = 0;
        api.velocity.set(velocity.current[0] * 0.9, velocity.current[1], velocity.current[2] * 0.9);
    }

    // Apply Drag
    if (effectiveDrag > 0) {
        force -= speedMs * 300 * effectiveDrag;
    }
    
    // Apply Air Resistance
    force -= speedKmh * 2; 

    const forceVec = forwardDir.clone().multiplyScalar(force);
    api.applyForce([forceVec.x, 0, forceVec.z], [0,0,0]);

    // Sync Visual Rotation
    sphereRef.current.rotation.set(0, heading.current, 0);


    // --- CHASE CAMERA LOGIC ---
    // Ideally, we want the camera:
    // 1. Behind the bike
    // 2. Slightly above
    // 3. Following rotation gently
    
    const desiredDist = 8;
    const desiredHeight = 3.5;

    // Calculate position behind bike based on current heading
    const offset = new THREE.Vector3(0, desiredHeight, -desiredDist);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), heading.current);
    
    const targetPos = pos.clone().add(offset);
    
    // Lerp camera position for smoothness
    // We use a higher lerp value so it doesn't lag too much during turns
    camera.position.lerp(targetPos, delta * 5);
    
    // Look slightly above the bike center to keep it in lower third of screen
    const lookTarget = pos.clone().add(new THREE.Vector3(0, 2, 0));
    cameraLookAt.current.lerp(lookTarget, delta * 10);
    camera.lookAt(cameraLookAt.current);

    // Update Store
    updateBikeData({
        rpm: engine.current.rpm,
        gear: engine.current.gear,
        speed: Math.floor(speedKmh),
    });

    soundEngine.current.update(engine.current.rpm, throttle);
  });

  return (
    <group ref={sphereRef as any}>
      <BikeVisuals 
        lean={controls.left ? 1 : controls.right ? -1 : 0} 
        speed={engine.current.speed} 
        config={bikeConfig}
      />
    </group>
  );
};
