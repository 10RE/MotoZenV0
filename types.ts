
export interface ControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  reset: boolean;
  interact: boolean;
}

export interface BikeState {
  rpm: number;
  gear: number; // 0 = Neutral, 1-5
  speed: number; // km/h
  isEngineRunning: boolean;
}

export interface BikeConfig {
  color: string;
  tires: 'street' | 'offroad';
  suspension: 'soft' | 'stiff';
}
