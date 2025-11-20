
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

  // Player State
  isMounted: boolean;
  canMount: boolean;
  toggleMount: () => void;
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

  isMounted: true,
  canMount: true,
  toggleMount: () => set((state) => ({ isMounted: !state.isMounted })),
  setCanMount: (val) => set({ canMount: val }),
}));
