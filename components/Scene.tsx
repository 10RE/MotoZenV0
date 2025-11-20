import React, { useRef } from 'react';
import { useBox, useCylinder, usePlane } from '@react-three/cannon';
import { BikeController } from './BikeController';
import { useGameStore } from '../store';
import { useKeyboardControls } from '../hooks/useKeyboardControls';

const Terrain: React.FC = () => {
  // Ground
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, 0, 0],
    material: { friction: 0.8, restitution: 0.1 } 
  }));

  // Procedural-ish props
  const rocks = useRef([...Array(30)].map(() => ({
    position: [
      (Math.random() - 0.5) * 300,
      0.5,
      (Math.random() - 0.5) * 300
    ],
    scale: Math.random() * 2 + 0.5,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0]
  })));

  return (
    <group>
      <mesh ref={ref as any} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#5c6b4a" roughness={0.8} />
      </mesh>
      <gridHelper args={[1000, 100, "#3d4c3a", "#4a5c45"]} position={[0, 0.01, 0]} />
      
      {/* Scattered Rocks */}
      {rocks.current.map((rock, i) => (
        <Rock key={i} position={rock.position as [number, number, number]} scale={rock.scale} rotation={rock.rotation as [number, number, number]} />
      ))}

       {/* Hills */}
      <Hill position={[-30, -2, -30]} args={[40, 5, 40]} />
      <Hill position={[40, -3, 20]} args={[30, 8, 30]} rotation={[0, Math.PI/4, 0]}/>
      <Hill position={[0, -4, -80]} args={[60, 10, 60]} />

      {/* --- Interactive Obstacles --- */}
      
      {/* Mud Pit */}
      <MudPit position={[10, 0.05, 10]} args={[15, 0.1, 20]} />
      <MudPit position={[-50, 0.05, -20]} args={[20, 0.1, 20]} />

      {/* Small Jump Ramp */}
      <Ramp position={[0, 0.5, 40]} rotation={[0, 0, -0.2]} args={[4, 0.2, 5]} />
      <Ramp position={[-20, 1, 60]} rotation={[0, Math.PI/2, -0.3]} args={[4, 0.2, 5]} />

      {/* Fallen Log */}
      <Log position={[20, 0.5, -10]} rotation={[0, 0, Math.PI/2]} args={[0.4, 0.4, 10]} />
      <Log position={[25, 0.5, -15]} rotation={[0, 0.5, Math.PI/2]} args={[0.5, 0.5, 8]} />

      {/* Water Stream */}
      <WaterStream position={[-40, 0.02, 0]} args={[15, 100]} />
    </group>
  );
};

const Rock: React.FC<{position: [number, number, number], scale: number, rotation: [number, number, number]}> = ({position, scale, rotation}) => {
    const [ref] = useBox(() => ({
        mass: 0, // Static
        position,
        rotation,
        args: [scale, scale, scale]
    }));
    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <dodecahedronGeometry args={[scale * 0.5, 0]} />
            <meshStandardMaterial color="#6b6b6b" roughness={0.9} />
        </mesh>
    )
}

const Hill: React.FC<{position: [number, number, number], args: [number, number, number], rotation?: [number, number, number]}> = ({position, args, rotation = [0,0,0]}) => {
    const [ref] = useBox(() => ({
        mass: 0,
        position,
        args,
        rotation,
    }));
    return (
        <mesh ref={ref as any} receiveShadow>
            <boxGeometry args={args} />
            <meshStandardMaterial color="#4f5e3e" />
        </mesh>
    )
}

const MudPit: React.FC<{position: [number, number, number], args: [number, number, number]}> = ({position, args}) => {
    const setTerrainData = useGameStore(s => s.setTerrainData);
    // Trigger for physics
    useBox(() => ({
        isTrigger: true,
        position,
        args,
        onCollideBegin: (e) => { if (e.body.name === 'bike-chassis') setTerrainData(0.8, 0.4); }, // High drag, low traction
        onCollideEnd: (e) => { if (e.body.name === 'bike-chassis') setTerrainData(0, 1); }
    }));

    return (
        <mesh position={position} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <planeGeometry args={[args[0], args[2]]} />
            <meshStandardMaterial color="#3e2723" roughness={1} />
        </mesh>
    );
}

const WaterStream: React.FC<{position: [number, number, number], args: [number, number]}> = ({position, args}) => {
    const setTerrainData = useGameStore(s => s.setTerrainData);
    useBox(() => ({
        isTrigger: true,
        position,
        args: [args[0], 0.5, args[1]],
        onCollideBegin: (e) => { if (e.body.name === 'bike-chassis') setTerrainData(0.5, 0.6); },
        onCollideEnd: (e) => { if (e.body.name === 'bike-chassis') setTerrainData(0, 1); }
    }));

    return (
        <mesh position={position} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={args} />
            <meshStandardMaterial color="#4fc3f7" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
        </mesh>
    );
}

const Ramp: React.FC<{position: [number, number, number], rotation: [number, number, number], args: [number, number, number]}> = ({position, rotation, args}) => {
    const [ref] = useBox(() => ({
        mass: 0,
        position,
        rotation,
        args
    }));
    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <boxGeometry args={args} />
            <meshStandardMaterial color="#8d6e63" />
        </mesh>
    )
}

const Log: React.FC<{position: [number, number, number], rotation: [number, number, number], args: [number, number, number]}> = ({position, rotation, args}) => {
    const [ref] = useCylinder(() => ({
        mass: 10,
        position,
        rotation,
        args: [args[0], args[1], args[2], 8]
    }));
    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <cylinderGeometry args={[args[0], args[1], args[2], 8]} />
            <meshStandardMaterial color="#3e2723" />
        </mesh>
    )
}

export const Scene: React.FC = () => {
  const controls = useKeyboardControls();

  return (
    <>
      <Terrain />
      <BikeController controls={controls} />
    </>
  );
};