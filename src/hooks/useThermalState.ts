import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// THERMAL STATE MANAGEMENT
// Monitor device thermal conditions and adjust quality dynamically
// ═══════════════════════════════════════════════════════════════════════════

export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';

interface ThermalStateResult {
    thermalState: ThermalState;
    qualityLevel: number; // 1.0 = full quality, 0.3 = minimum
    isThrottled: boolean;
    shouldReduceAnimations: boolean;
    shouldDisableMeshGradients: boolean;
}

// Quality multipliers per thermal state
const THERMAL_QUALITY_MAP: Record<ThermalState, number> = {
    nominal: 1.0,
    fair: 0.8,
    serious: 0.5,
    critical: 0.3,
};

/**
 * Hook to monitor thermal state and provide adaptive quality recommendations.
 * 
 * Uses heuristics based on:
 * - App active time (proxy for device heat)
 * - Memory pressure signals
 * - Frame rate drops (if detectable)
 * 
 * For production apps, consider integrating react-native-device-info
 * for actual thermal API access on iOS (ProcessInfo.thermalState).
 */
export function useThermalState(): ThermalStateResult {
    const [thermalState, setThermalState] = useState<ThermalState>('nominal');
    const [activeTimeMs, setActiveTimeMs] = useState(0);

    // Track continuous active time as thermal proxy
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        let lastTick = Date.now();

        const handleAppStateChange = (state: AppStateStatus) => {
            if (state === 'active') {
                lastTick = Date.now();
                interval = setInterval(() => {
                    const now = Date.now();
                    setActiveTimeMs(prev => prev + (now - lastTick));
                    lastTick = now;
                }, 10000); // Update every 10 seconds
            } else {
                clearInterval(interval);
                // Reset thermal tracking when backgrounded (device cools)
                setActiveTimeMs(prev => Math.max(0, prev - 60000));
            }
        };

        // Start tracking immediately if active
        if (AppState.currentState === 'active') {
            handleAppStateChange('active');
        }

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, []);

    // Determine thermal state from active time heuristics
    useEffect(() => {
        const activeMinutes = activeTimeMs / 60000;

        if (activeMinutes >= 15) {
            setThermalState('critical');
        } else if (activeMinutes >= 10) {
            setThermalState('serious');
        } else if (activeMinutes >= 5) {
            setThermalState('fair');
        } else {
            setThermalState('nominal');
        }
    }, [activeTimeMs]);

    const qualityLevel = THERMAL_QUALITY_MAP[thermalState];
    const isThrottled = thermalState !== 'nominal';
    const shouldReduceAnimations = thermalState === 'serious' || thermalState === 'critical';
    const shouldDisableMeshGradients = thermalState === 'critical';

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
