
import { useEffect, useState, useCallback } from 'react';
import { ControlsState } from '../types';

export const useKeyboardControls = (): ControlsState => {
  const [input, setInput] = useState<ControlsState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    reset: false,
    interact: false,
  });

  const handleKey = useCallback((e: any, isPressed: boolean) => {
    const key = e.code;
    switch (key) {
      case 'KeyW': setInput(s => ({ ...s, forward: isPressed })); break;
      case 'KeyS': setInput(s => ({ ...s, backward: isPressed })); break;
      case 'KeyA': setInput(s => ({ ...s, left: isPressed })); break;
      case 'KeyD': setInput(s => ({ ...s, right: isPressed })); break;
      case 'Space': setInput(s => ({ ...s, brake: isPressed })); break;
      case 'KeyR':
        if (isPressed) setInput(s => ({ ...s, reset: true }));
        else setInput(s => ({ ...s, reset: false }));
        break;
      case 'KeyF': setInput(s => ({ ...s, interact: isPressed })); break;
    }
  }, []);

  useEffect(() => {
    const down = (e: any) => handleKey(e, true);
    const up = (e: any) => handleKey(e, false);
    (window as any).addEventListener('keydown', down);
    (window as any).addEventListener('keyup', up);
    return () => {
      (window as any).removeEventListener('keydown', down);
      (window as any).removeEventListener('keyup', up);
    };
  }, [handleKey]);

  return input;
};
