import React from 'react';
import { useGameStore } from '../store';
import { Activity, Settings, X } from 'lucide-react';

export const UI: React.FC = () => {
  const bikeData = useGameStore(s => s.bikeData);
  const bikeConfig = useGameStore(s => s.bikeConfig);
  const setBikeConfig = useGameStore(s => s.setBikeConfig);
  
  const isCustomizing = useGameStore(s => s.isCustomizing);
  const setCustomizing = useGameStore(s => s.setCustomizing);

  // Calculate gauge rotations
  const rpmPercent = Math.min(bikeData.rpm / 10000, 1);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* Controls Hint */}
      <div className="absolute top-4 left-4 text-white/50 text-xs font-mono space-y-1">
        <div>W/S - Throttle & Brake</div>
        <div>A/D - Steer</div>
        <div>SPACE - Handbrake</div>
        <div>R - Reset Position</div>
      </div>

      {/* Customize Button (Always Visible) */}
      {!isCustomizing && (
        <div className="absolute top-4 right-4 pointer-events-auto">
           <button 
             onClick={() => setCustomizing(true)}
             className="bg-gray-900/80 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 flex items-center gap-2 transition-all shadow-lg"
           >
             <Settings size={16} /> <span className="text-sm font-bold">GARAGE</span>
           </button>
        </div>
      )}

      {/* Customization Menu */}
      {isCustomizing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto">
            <div className="bg-gray-900 w-96 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Garage</h2>
                    <button onClick={() => setCustomizing(false)} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Color */}
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm font-bold mb-2">Body Color</label>
                    <div className="flex gap-3">
                        {['#f97316', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#000000', '#ffffff'].map(color => (
                            <button
                                key={color}
                                onClick={() => setBikeConfig({ color })}
                                className={`w-8 h-8 rounded-full border-2 ${bikeConfig.color === color ? 'border-white scale-110' : 'border-transparent hover:scale-110'} transition-transform`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Tires */}
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm font-bold mb-2">Tires</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setBikeConfig({ tires: 'street' })}
                            className={`p-3 rounded-lg border ${bikeConfig.tires === 'street' ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            <div className="font-bold">Street Slick</div>
                            <div className="text-xs opacity-70">Fast on road, slippy on mud.</div>
                        </button>
                        <button
                            onClick={() => setBikeConfig({ tires: 'offroad' })}
                            className={`p-3 rounded-lg border ${bikeConfig.tires === 'offroad' ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            <div className="font-bold">Knobby Offroad</div>
                            <div className="text-xs opacity-70">Max grip in mud, stable.</div>
                        </button>
                    </div>
                </div>

                {/* Suspension */}
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm font-bold mb-2">Suspension</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setBikeConfig({ suspension: 'soft' })}
                            className={`p-3 rounded-lg border ${bikeConfig.suspension === 'soft' ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            <div className="font-bold">Soft Trail</div>
                            <div className="text-xs opacity-70">Absorbs bumps.</div>
                        </button>
                        <button
                            onClick={() => setBikeConfig({ suspension: 'stiff' })}
                            className={`p-3 rounded-lg border ${bikeConfig.suspension === 'stiff' ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            <div className="font-bold">Stiff Sport</div>
                            <div className="text-xs opacity-70">Better cornering.</div>
                        </button>
                    </div>
                </div>
                
                <button onClick={() => setCustomizing(false)} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg">
                    Drive
                </button>
            </div>
        </div>
      )}

      {/* Dashboard */}
      {!isCustomizing && (
        <div className="absolute bottom-8 right-8 flex items-end space-x-6 pointer-events-none">
            
            {/* Gear Indicator */}
            <div className="flex flex-col items-center mb-2">
                <div className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Gear</div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl font-black border-2 border-orange-500 text-white bg-gray-900/50">
                    {bikeData.gear}
                </div>
            </div>

            {/* Cluster */}
            <div className="relative w-64 h-32 bg-gradient-to-t from-gray-900/90 to-gray-800/50 backdrop-blur-md rounded-t-3xl border-t border-x border-white/10 p-4">
                
                {/* RPM Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-100 ${bikeData.rpm > 9000 ? 'bg-red-500' : 'bg-blue-400'}`} 
                        style={{ width: `${rpmPercent * 100}%` }}
                    />
                </div>

                <div className="flex justify-between items-end mt-2">
                    {/* Speed */}
                    <div className="text-center">
                        <div className="text-6xl font-black text-white leading-none tracking-tighter">
                            {bikeData.speed}
                        </div>
                        <div className="text-xs text-gray-400 font-bold uppercase">km/h</div>
                    </div>

                    {/* Info */}
                    <div className="text-right space-y-1">
                         <div className="text-xs text-gray-500 font-mono">
                            {Math.floor(bikeData.rpm)} <span className="text-[10px]">RPM</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
