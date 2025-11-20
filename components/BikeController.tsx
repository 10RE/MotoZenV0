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
}

export const BikeController: React.FC<BikeProps> = ({ controls }) => {
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

  // Initialize audio on first interaction
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

  useFrame((state, delta) => {
    if (!sphereRef.current) return;

    const pos = sphereRef.current.position;
    
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
    if (speedKmh < 30) engine.current.gear = 1;
    else if (speedKmh < 60) engine.current.gear = 2;
    else if (speedKmh < 90) engine.current.gear = 3;
    else if (speedKmh < 120) engine.current.gear = 4;
    else engine.current.gear = 5;

    // RPM Logic
    const gearMinSpeeds = [0, 0, 30, 60, 90, 120];
    const gearMaxSpeeds = [0, 40, 70, 100, 130, 200];
    const currentMin = gearMinSpeeds[engine.current.gear];
    const currentMax = gearMaxSpeeds[engine.current.gear];
    const range = currentMax - currentMin;
    const ratio = (speedKmh - currentMin) / range;
    
    let targetRpm = IDLE_RPM + (ratio * (REDLINE_RPM - IDLE_RPM));
    if (controls.forward && engine.current.gear === 1 && speedKmh < 10) {
         targetRpm = Math.max(targetRpm, 3000); 
    }
    engine.current.rpm = THREE.MathUtils.lerp(engine.current.rpm, Math.max(IDLE_RPM, targetRpm), delta * 5);

    // Movement Logic
    const throttle = controls.forward ? 1 : 0;
    const brake = controls.backward ? 1 : 0; 
    const handbrake = controls.brake ? 1 : 0;

    // Steering
    if (speedKmh > 0.5) {
        const steerAmt = controls.left ? 1 : controls.right ? -1 : 0;
        const sensitivity = Math.max(0.5, 2.5 - (speedKmh / 80));
        heading.current += steerAmt * delta * sensitivity;
    }

    // Forces
    const forwardDir = new THREE.Vector3(Math.sin(heading.current), 0, Math.cos(heading.current));
    let force = 0;

    const powerMult = bikeConfig.suspension === 'stiff' ? 1.1 : 1.0;

    if (throttle && speedKmh < TOP_SPEED) {
        force = 1200 * powerMult * effectiveTraction;
        force -= (engine.current.gear * 50); 
    }

    if (brake) {
        if (speedKmh > 1) {
            force = -BRAKE_FORCE * 50;
        } else {
            force = -300; 
        }
    }

    if (handbrake) {
        force = 0;
        api.velocity.set(velocity.current[0] * 0.9, velocity.current[1], velocity.current[2] * 0.9);
    }

    if (effectiveDrag > 0) {
        force -= speedMs * 300 * effectiveDrag;
    }
    
    force -= speedKmh * 2; 

    const forceVec = forwardDir.clone().multiplyScalar(force);
    api.applyForce([forceVec.x, 0, forceVec.z], [0,0,0]);

    // Sync Visual Rotation
    if (sphereRef.current) {
        sphereRef.current.rotation.set(0, heading.current, 0);
    }

    // --- RIGID ATTACHED CAMERA LOGIC ---
    const offsetDist = 7;
    const offsetHeight = 3.5;

    // Calculate camera position behind the bike based on heading
    const camX = pos.x - Math.sin(heading.current) * offsetDist;
    const camZ = pos.z - Math.cos(heading.current) * offsetDist;
    const camY = pos.y + offsetHeight;

    // Set position directly (no lerp) to ensure it's attached
    camera.position.set(camX, camY, camZ);
    
    // Look at the bike (with a slight vertical offset to keep bike in lower frame)
    camera.lookAt(pos.x, pos.y + 1.5, pos.z);

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