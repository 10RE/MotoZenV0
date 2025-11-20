import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky, Environment, Loader } from '@react-three/drei';
import { Scene } from './components/Scene';
import { UI } from './components/UI';

const App: React.FC = () => {
  const [started, setStarted] = useState(false);

  return (
    <div className="relative w-full h-full bg-gray-900 text-white">
      {!started ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/90 space-y-6">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-200 tracking-tighter">
            MOTOZEN
          </h1>
          <p className="text-gray-400 max-w-md text-center">
            Off-road exploration. Automatic transmission. Chill vibes.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between"><span>Throttle</span> <span className="font-bold text-white">W</span></div>
            <div className="flex justify-between"><span>Brake / Reverse</span> <span className="font-bold text-white">S</span></div>
            <div className="flex justify-between"><span>Steer</span> <span className="font-bold text-white">A / D</span></div>
            <div className="flex justify-between"><span>Handbrake</span> <span className="font-bold text-white">Space</span></div>
            <div className="flex justify-between"><span>Reset Bike</span> <span className="font-bold text-white">R</span></div>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-orange-500/20"
          >
            Ride
          </button>
        </div>
      ) : (
        <>
          <Canvas shadows camera={{ position: [0, 5, -10], fov: 50 }}>
            <Suspense fallback={null}>
              <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
              <Environment preset="sunset" />
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[50, 50, 25]} 
                intensity={1.5} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
              />
              
              <Physics gravity={[0, -9.81, 0]} frictionGravity={[0, 1, 0]} allowSleep={false}>
                <Scene />
              </Physics>
            </Suspense>
          </Canvas>
          <UI />
        </>
      )}
      <Loader />
    </div>
  );
};

export default App;
