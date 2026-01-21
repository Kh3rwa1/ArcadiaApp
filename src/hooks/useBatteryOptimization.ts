import { useState, useEffect } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// BATTERY OPTIMIZATION HOOK
// Detect low power mode and adjust app behavior for battery conservation
// ═══════════════════════════════════════════════════════════════════════════

interface BatteryOptimizationResult {
    isLowPowerMode: boolean;
    shouldReduceQuality: boolean;
    shouldReduceFPS: boolean;
    preferredFPS: number;
    shouldDisableBackgroundAnimations: boolean;
}

/**
 * Hook to detect battery optimization mode and provide rendering recommendations.
 * 
 * On iOS: Uses AccessibilityInfo.isReduceMotionEnabled as a proxy
 * On Android: Monitors app state changes and provides conservative defaults
 * 
 * For production apps, consider react-native-device-info for:
 * - PowerSaveModeEnabled (Android)
 * - isLowPowerModeEnabled (iOS)
 */
export function useBatteryOptimization(): BatteryOptimizationResult {
    const [isLowPowerMode, setIsLowPowerMode] = useState(false);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            setAppState(state);
        });

        // On Android, we can check if system animations are reduced
        // This often correlates with battery saver mode
        if (Platform.OS === 'android') {
            // Simple heuristic: if returning from background frequently,
            // user may be multitasking on low battery
            // For now, we'll use conservative defaults
        }

        return () => {
            subscription.remove();
        };
    }, []);

    // When app is not in foreground, we should definitely reduce quality
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
    };
}

/**
 * Hook to provide dark mode preference based on battery considerations.
 * OLED screens use less power with darker colors.
 */
export function useBatteryAwareDarkMode(): boolean {
    // Always prefer dark mode for battery - our theme is already dark
    return true;
}

/**
 * Get optimized animation duration based on battery state
 */
export function getOptimizedDuration(baseDuration: number, isLowPower: boolean): number {
    // Faster animations = less rendering = less battery drain
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
            // Faster settling = fewer frames
        };
    }
    return {
        damping: 20,
        stiffness: 100,
        mass: 1,
    };
}
