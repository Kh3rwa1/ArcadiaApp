// ═══════════════════════════════════════════════════════════════════════════
// BATTERY OPTIMIZATION HOOK
// No-op implementation — isLowPowerMode is always false.
// To detect real low-power mode, integrate a native module such as
// react-native-device-info (PowerSaveModeEnabled / isLowPowerModeEnabled)
// and wire it into the setState call below.
// ═══════════════════════════════════════════════════════════════════════════

import { AppState, AppStateStatus } from 'react-native';
import { useState, useEffect } from 'react';

interface BatteryOptimizationResult {
    isLowPowerMode: boolean;
    shouldReduceQuality: boolean;
    shouldReduceFPS: boolean;
    preferredFPS: number;
    shouldDisableBackgroundAnimations: boolean;
    batteryLevel: number | null;
}

export function useBatteryOptimization(): BatteryOptimizationResult {
    const [isLowPowerMode] = useState(false);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            setAppState(state);
        });
        return () => {
            subscription.remove();
        };
    }, []);

    const isInBackground = appState !== 'active';

    const shouldReduceQuality = isLowPowerMode || isInBackground;
    const shouldReduceFPS = isLowPowerMode;
    const preferredFPS = isLowPowerMode ? 30 : 60;
    const shouldDisableBackgroundAnimations = isLowPowerMode || isInBackground;

    return {
        isLowPowerMode,
        shouldReduceQuality,
        shouldReduceFPS,
        preferredFPS,
        shouldDisableBackgroundAnimations,
        batteryLevel: null,
    };
}

/**
 * Hook to provide dark mode preference based on battery considerations.
 * OLED screens use less power with darker colors.
 */
export function useBatteryAwareDarkMode(): boolean {
    return true;
}

/**
 * Get optimized animation duration based on battery state
 */
export function getOptimizedDuration(baseDuration: number, isLowPower: boolean): number {
    return isLowPower ? Math.floor(baseDuration * 0.7) : baseDuration;
}

/**
 * Get optimized spring config for battery conservation
 */
export function getOptimizedSpringConfig(isLowPower: boolean) {
    if (isLowPower) {
        return {
            damping: 30,
            stiffness: 200,
            mass: 0.5,
        };
    }
    return {
        damping: 20,
        stiffness: 100,
        mass: 1,
    };
}
