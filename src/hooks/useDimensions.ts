import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions, ScaledSize, Platform, Animated } from 'react-native';

interface WindowDimensions {
    width: number;
    height: number;
}

/**
 * Hook that provides dynamic window dimensions that update on resize.
 * Works on both native (orientation changes) and web (window resize).
 */
export function useWindowDimensions(): WindowDimensions {
    const [dimensions, setDimensions] = useState<WindowDimensions>(() => {
        const { width, height } = Dimensions.get('window');
        return { width, height };
    });

    useEffect(() => {
        // Handle React Native dimension changes (orientation, etc.)
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions({
                width: window.width,
                height: window.height,
            });
        });

        // For web platform, also listen to window resize events
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const handleResize = () => {
                setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            };

            // Initial sync with window dimensions
            handleResize();

            window.addEventListener('resize', handleResize);
            return () => {
                subscription?.remove();
                window.removeEventListener('resize', handleResize);
            };
        }

        return () => {
            subscription?.remove();
        };
    }, []);

    return dimensions;
}

/**
 * Get responsive sizing based on screen width
 */
export function useResponsiveValue<T>(breakpoints: { sm?: T; md?: T; lg?: T; default: T }): T {
    const { width } = useWindowDimensions();

    if (width >= 1024 && breakpoints.lg !== undefined) return breakpoints.lg;
    if (width >= 768 && breakpoints.md !== undefined) return breakpoints.md;
    if (width >= 375 && breakpoints.sm !== undefined) return breakpoints.sm;
    return breakpoints.default;
}

/**
 * Detect small devices for adaptive UI (phones < 375px width or < 700px height)
 */
export function useIsSmallDevice(): boolean {
    const { width, height } = useWindowDimensions();
    return width < 375 || height < 700;
}

/**
 * Reusable scale animation hook for consistent micro-interactions
 * Returns press handlers and animated scale value for 60fps button feedback
 */
export function useScaleAnimation(config?: {
    pressedScale?: number;
    tension?: number;
    friction?: number;
}) {
    const {
        pressedScale = 0.92,
        tension = 200,
        friction = 12,
    } = config || {};

    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: pressedScale,
            tension,
            friction,
            useNativeDriver: true,
        }).start();
    }, [pressedScale, tension, friction]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            tension: tension * 0.8,
            friction: friction * 1.2,
            useNativeDriver: true,
        }).start();
    }, [tension, friction]);

    return {
        scale,
        handlePressIn,
        handlePressOut,
        animatedStyle: { transform: [{ scale }] },
    };
}

/**
 * Get scaled value based on screen size for responsive elements
 */
export function useScaledSize(baseSize: number): number {
    const { width } = useWindowDimensions();
    // Scale factor based on iPhone 14 Pro width (393px as reference)
    const scaleFactor = Math.min(width / 393, 1.2);
    return Math.round(baseSize * scaleFactor);
}

/**
 * Detect user preference for reduced motion (accessibility)
 * Falls back to false if not available
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check for web platform MediaQuery
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            setPrefersReducedMotion(mediaQuery.matches);

            const handler = (e: MediaQueryListEvent) => {
                setPrefersReducedMotion(e.matches);
            };

            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }

        // For native, we could use AccessibilityInfo.isReduceMotionEnabled()
        // but it requires async handling - default to false for now
        return undefined;
    }, []);

    return prefersReducedMotion;
}

/**
 * Get platform-appropriate minimum touch target size
 * iOS: 44pt (Apple HIG)
 * Android: 48dp (Material Design)
 */
export function useTouchTargetSize(): number {
    return Platform.select({ ios: 44, android: 48, default: 44 }) as number;
}

/**
 * Ensure a dimension meets minimum touch target requirements
 */
export function ensureTouchTarget(size: number, minimum: number = 44): number {
    return Math.max(size, minimum);
}
