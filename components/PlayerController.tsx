import React, { useRef, useEffect } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ControlsState } from '../types';
import { useGameStore } from '../store';

interface PlayerProps {
  isActive: boolean;
  controls: ControlsState;
  bikePosition: THREE.Vector3;
}

export const PlayerController: React.FC<PlayerProps> = ({ isActive, controls, bikePosition }) => {
  const { camera } = useThree();
  const toggleMount = useGameStore(s => s.toggleMount);
  const canMount = useGameStore(s => s.canMount);

  const [ref, api] = useSphere(() => ({
    mass: 1,
    position: [2, 5, 2], // Start near bike
    args: [0.5],
    type: 'Dynamic',
    fixedRotation: true, // Prevent tumbling
    linearDamping: 0.9 // Stop quickly
  }));

  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe(v => velocity.current = v), [api.velocity]);

  // Ref to track player pos for mounting check
  const playerPos = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!ref.current) return;
    playerPos.current.copy(ref.current.position);

    // Mounting Logic
    if (controls.interact && canMount) {
        const dist = playerPos.current.distanceTo(bikePosition);
        if (dist < 3) {
            toggleMount();
            api.position.set(bikePosition.x, bikePosition.y + 2, bikePosition.z);
        }
    }

    // If we are RIDING, this controller should sleep or follow bike
    if (!isActive) {
        api.position.set(bikePosition.x, bikePosition.y + 1, bikePosition.z);
        return; 
    }
    
    // WALKING LOGIC
    const speed = 5;
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, (controls.backward ? 1 : 0) - (controls.forward ? 1 : 0));
    const sideVector = new THREE.Vector3((controls.left ? 1 : 0) - (controls.right ? 1 : 0), 0, 0);

    direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(speed)
        .applyEuler(camera.rotation);

    api.velocity.set(direction.x, velocity.current[1], direction.z);

    // Camera Control (Third Person Walking)
    // Fixed offset camera for walking
    const camTarget = ref.current.position.clone().add(new THREE.Vector3(0, 1, 0));
    // Camera position: Up 3, Back 5
    camera.position.lerp(ref.current.position.clone().add(new THREE.Vector3(0, 3, 5)), 0.1);
    camera.lookAt(camTarget);
    
    // HACK: To toggle back ON bike
    const dist = playerPos.current.distanceTo(bikePosition);
    if (controls.interact && dist < 3) {
       toggleMount();
    }
  });

  return (
    <mesh ref={ref as any}>
      <capsuleGeometry args={[0.3, 1, 4]} />
      <meshStandardMaterial color="#00ff00" visible={false} />
    </mesh>
  );
};