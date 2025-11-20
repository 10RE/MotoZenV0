import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BikeConfig } from '../types';

interface VisualProps {
    lean: number;
    speed: number;
    config?: BikeConfig;
}

export const BikeVisuals: React.FC<VisualProps> = ({ lean, speed, config }) => {
  const group = useRef<THREE.Group>(null);
  const frontWheel = useRef<THREE.Group>(null);
  const rearWheel = useRef<THREE.Group>(null);
  const handlebar = useRef<THREE.Group>(null);

  const bodyColor = config?.color || "#f97316";
  const isKnobby = config?.tires === 'offroad';

  useFrame((state, delta) => {
    if (group.current) {
        // Lean logic
        const targetLean = lean * (Math.PI / 4) * (Math.min(speed, 50) / 50);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetLean, delta * 5);
        
        // Wheel spin
        const spinSpeed = speed / 2; 
        if (frontWheel.current) frontWheel.current.rotation.x -= spinSpeed * delta;
        if (rearWheel.current) rearWheel.current.rotation.x -= spinSpeed * delta;

        // Handlebar turn
        if (handlebar.current) {
            handlebar.current.rotation.y = lean * 0.3;
            if (frontWheel.current) frontWheel.current.rotation.y = lean * 0.3;
        }
    }
  });

  const frameColor = "#e0e0e0"; 
  const seatColor = "#4b2c20"; 
  const tireColor = "#1a1a1a"; 
  const rimColor = "#333";

  // Tire Geometry
  // Knobby tires are slightly wider and have a different look (simulated by scale/segments here roughly)
  const tireWidth = isKnobby ? 0.25 : 0.2;
  const tireSegs = isKnobby ? 12 : 24; // Lower poly for 'blocky' knobby look

  return (
    <group ref={group} position={[0, -0.5, 0]}> 
      
      {/* --- Main Frame --- */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 1.2]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0.1]} castShadow>
        <boxGeometry args={[0.35, 0.4, 0.5]} />
        <meshStandardMaterial color="#555" roughness={0.7} />
      </mesh>

      {/* Tank */}
      <mesh position={[0, 0.9, 0.3]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.7]} />
        <meshStandardMaterial color={bodyColor} roughness={0.2} />
      </mesh>

      {/* Seat */}
      <mesh position={[0, 0.85, -0.4]} castShadow>
        <boxGeometry args={[0.35, 0.15, 0.6]} />
        <meshStandardMaterial color={seatColor} roughness={0.9} />
      </mesh>

      {/* --- Rear Swingarm & Wheel --- */}
      <group position={[0, 0.3, -0.8]}>
        <mesh position={[0, 0.2, 0.4]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.6]} />
            <meshStandardMaterial color={frameColor} />
        </mesh>
        <group ref={rearWheel}>
             <mesh rotation={[0, 0, Math.PI/2]} castShadow>
                <cylinderGeometry args={[0.35, 0.35, tireWidth, tireSegs]} />
                <meshStandardMaterial color={tireColor} roughness={isKnobby ? 1 : 0.5} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.2, 0.2, tireWidth + 0.01, 16]} />
                <meshStandardMaterial color={rimColor} metalness={0.5} />
            </mesh>
        </group>
      </group>

      {/* --- Front Fork & Wheel --- */}
      <group position={[0, 0.3, 0.8]}>
          <group ref={handlebar} position={[0, 0.8, -0.1]}> 
             <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                <meshStandardMaterial color="#111" />
             </mesh>
             <mesh position={[0, -0.1, 0.2]}>
                 <boxGeometry args={[0.2, 0.2, 0.1]} />
                 <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
             </mesh>
          </group>

          <group ref={frontWheel} rotation={[0,0,0]}> 
            <mesh position={[-0.1, 0.4, 0]} rotation={[-0.3, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.8]} />
                <meshStandardMaterial color={config?.suspension === 'stiff' ? "#888" : "gold"} metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[0.1, 0.4, 0]} rotation={[-0.3, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.8]} />
                <meshStandardMaterial color={config?.suspension === 'stiff' ? "#888" : "gold"} metalness={0.6} roughness={0.2} />
            </mesh>

             <mesh rotation={[0, 0, Math.PI/2]} castShadow>
                <cylinderGeometry args={[0.35, 0.35, tireWidth * 0.8, tireSegs]} />
                <meshStandardMaterial color={tireColor} roughness={isKnobby ? 1 : 0.5} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.2, 0.2, tireWidth * 0.8 + 0.01, 16]} />
                <meshStandardMaterial color={rimColor} metalness={0.5} />
            </mesh>
          </group>
      </group>

      {/* Exhaust */}
      <mesh position={[0.2, 0.2, -0.3]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.8]} />
          <meshStandardMaterial color="#777" metalness={0.8} />
      </mesh>
    </group>
  );
};