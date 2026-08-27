import { AppStateStatus } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import {
  useBatteryOptimization,
  useBatteryAwareDarkMode,
  getOptimizedDuration,
  getOptimizedSpringConfig,
} from './useBatteryOptimization';

let mockAppState: AppStateStatus = 'active';

jest.mock('react-native', () => {
  return {
    AppState: {
      get currentState() {
        return mockAppState;
      },
      addEventListener: jest.fn((event: string, cb: (state: AppStateStatus) => void) => {
        return { remove: jest.fn() };
      }),
    },
    Platform: { OS: 'ios', select: (obj: any) => obj.ios ?? obj.default },
    Dimensions: {
      get: jest.fn(() => ({ width: 393, height: 852 })),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});

describe('useBatteryOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppState = 'active';
  });

  it('returns isLowPowerMode as false', () => {
    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.isLowPowerMode).toBe(false);
  });

  it('returns batteryLevel as null', () => {
    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.batteryLevel).toBeNull();
  });

  it('shouldReduceQuality returns false when in foreground and not low power', () => {
    mockAppState = 'active';
    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.shouldReduceQuality).toBe(false);
  });

  it('shouldDisableBackgroundAnimations returns true when in background', () => {
    mockAppState = 'background';
    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.shouldDisableBackgroundAnimations).toBe(true);
  });

  it('shouldDisableBackgroundAnimations returns false when active', () => {
    mockAppState = 'active';
    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.shouldDisableBackgroundAnimations).toBe(false);
  });

  it('shouldReduceFPS is false when not in low power mode', () => {
    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.shouldReduceFPS).toBe(false);
  });

  it('preferredFPS is 60 when not in low power mode', () => {
    const { result } = renderHook(() => useBatteryOptimization());
    expect(result.current.preferredFPS).toBe(60);
  });

  it('subscribes to AppState changes', () => {
    const { AppState } = require('react-native');
    renderHook(() => useBatteryOptimization());
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('useBatteryAwareDarkMode', () => {
  it('always returns true', () => {
    const { result } = renderHook(() => useBatteryAwareDarkMode());
    expect(result.current).toBe(true);
  });
});

describe('getOptimizedDuration', () => {
  it('returns full duration when not in low power mode', () => {
    expect(getOptimizedDuration(300, false)).toBe(300);
  });

  it('returns reduced duration when in low power mode', () => {
    expect(getOptimizedDuration(300, true)).toBe(210);
  });

  it('floors the reduced duration', () => {
    expect(getOptimizedDuration(100, true)).toBe(70);
  });

  it('handles zero duration', () => {
    expect(getOptimizedDuration(0, true)).toBe(0);
  });
});

describe('getOptimizedSpringConfig', () => {
  it('returns standard config when not in low power mode', () => {
    expect(getOptimizedSpringConfig(false)).toEqual({
      damping: 20,
      stiffness: 100,
      mass: 1,
    });
  });

  it('returns power-saving config when in low power mode', () => {
    expect(getOptimizedSpringConfig(true)).toEqual({
      damping: 30,
      stiffness: 200,
      mass: 0.5,
    });
  });
});
