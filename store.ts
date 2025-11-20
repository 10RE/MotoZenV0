
import { create } from 'zustand';
import { BikeState, BikeConfig } from './types';

interface GameState {
  // Bike Telemetry (for UI)
  bikeData: BikeState;
  updateBikeData: (data: Partial<BikeState>) => void;

  // Customization
  bikeConfig: BikeConfig;
  setBikeConfig: (config: Partial<BikeConfig>) => void;

  // Environment Interaction
  terrainDrag: number; // 0 = normal, 1 = stuck
  terrainTraction: number; // 1 = normal, 0.5 = slippery
  setTerrainData: (drag: number, traction: number) => void;
  
  // UI State
  isCustomizing: boolean;
  setCustomizing: (val: boolean) => void;

  // Player Interaction
  isRiding: boolean;
  toggleMount: () => void;
  canMount: boolean;
  setCanMount: (val: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  bikeData: {
    rpm: 0,
    gear: 1,
    speed: 0,
    isEngineRunning: true,
  },
  updateBikeData: (data) => set((state) => ({ bikeData: { ...state.bikeData, ...data } })),

  bikeConfig: {
    color: '#f97316', // Default Orange
    tires: 'offroad',
    suspension: 'soft',
  },
  setBikeConfig: (config) => set((state) => ({ bikeConfig: { ...state.bikeConfig, ...config } })),

  terrainDrag: 0,
  terrainTraction: 1,
  setTerrainData: (drag, traction) => set({ terrainDrag: drag, terrainTraction: traction }),

  isCustomizing: false,
  setCustomizing: (val) => set({ isCustomizing: val }),

  // Player Interaction Defaults
  isRiding: true,
  toggleMount: () => set((state) => ({ isRiding: !state.isRiding })),
  canMount: true,
  setCanMount: (val) => set({ canMount: val }),
}));
