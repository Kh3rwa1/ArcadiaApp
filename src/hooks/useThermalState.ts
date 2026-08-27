// ═══════════════════════════════════════════════════════════════════════════
// THERMAL STATE MANAGEMENT
// No-op implementation — always returns 'nominal'.
// To detect real thermal state, integrate a native module such as
// react-native-device-info (iOS ProcessInfo.thermalState) and wire
// it into the setState call below.
// ═══════════════════════════════════════════════════════════════════════════

export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';

interface ThermalStateResult {
    thermalState: ThermalState;
    qualityLevel: number; // 1.0 = full quality, 0.3 = minimum
    isThrottled: boolean;
    shouldReduceAnimations: boolean;
    shouldDisableMeshGradients: boolean;
}

const THERMAL_QUALITY_MAP: Record<ThermalState, number> = {
    nominal: 1.0,
    fair: 0.8,
    serious: 0.5,
    critical: 0.3,
};

export function useThermalState(): ThermalStateResult {
    const thermalState: ThermalState = 'nominal';

    const qualityLevel = THERMAL_QUALITY_MAP[thermalState];
    const isThrottled = false; // Would be true when thermalState !== 'nominal' with real detection
    const shouldReduceAnimations = false; // Would be true when thermalState === 'serious' || 'critical'
    const shouldDisableMeshGradients = false; // Would be true when thermalState === 'critical'

    return {
        thermalState,
        qualityLevel,
        isThrottled,
        shouldReduceAnimations,
        shouldDisableMeshGradients,
    };
}

/**
 * Get recommended FPS target based on thermal state
 */
export function getTargetFPS(thermalState: ThermalState): number {
    switch (thermalState) {
        case 'nominal': return 60;
        case 'fair': return 60;
        case 'serious': return 30;
        case 'critical': return 30;
    }
}

/**
 * Get recommended render batch size for FlatList
 */
export function getRenderBatchSize(thermalState: ThermalState): number {
    switch (thermalState) {
        case 'nominal': return 2;
        case 'fair': return 2;
        case 'serious': return 1;
        case 'critical': return 1;
    }
}
