import {
  useThermalState,
  getTargetFPS,
  getRenderBatchSize,
  ThermalState,
} from './useThermalState';

describe('useThermalState', () => {
  it('returns nominal thermal state', () => {
    const result = useThermalState();
    expect(result.thermalState).toBe('nominal');
  });

  it('returns qualityLevel of 1.0 for nominal state', () => {
    const result = useThermalState();
    expect(result.qualityLevel).toBe(1.0);
  });

  it('returns isThrottled as false', () => {
    const result = useThermalState();
    expect(result.isThrottled).toBe(false);
  });

  it('returns shouldReduceAnimations as false', () => {
    const result = useThermalState();
    expect(result.shouldReduceAnimations).toBe(false);
  });

  it('returns shouldDisableMeshGradients as false', () => {
    const result = useThermalState();
    expect(result.shouldDisableMeshGradients).toBe(false);
  });
});

describe('getTargetFPS', () => {
  it('returns 60 for nominal', () => {
    expect(getTargetFPS('nominal')).toBe(60);
  });

  it('returns 60 for fair', () => {
    expect(getTargetFPS('fair')).toBe(60);
  });

  it('returns 30 for serious', () => {
    expect(getTargetFPS('serious')).toBe(30);
  });

  it('returns 30 for critical', () => {
    expect(getTargetFPS('critical')).toBe(30);
  });
});

describe('getRenderBatchSize', () => {
  it('returns 2 for nominal', () => {
    expect(getRenderBatchSize('nominal')).toBe(2);
  });

  it('returns 2 for fair', () => {
    expect(getRenderBatchSize('fair')).toBe(2);
  });

  it('returns 1 for serious', () => {
    expect(getRenderBatchSize('serious')).toBe(1);
  });

  it('returns 1 for critical', () => {
    expect(getRenderBatchSize('critical')).toBe(1);
  });
});
