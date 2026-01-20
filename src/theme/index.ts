// ═══════════════════════════════════════════════════════════════════════════
// ARCADIA DESIGN SYSTEM — $200B Aesthetic
// Ultra-Premium Visual Language
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
    // Core Palette — True black gradient
    void: '#000000',
    cosmic: '#030304',
    obsidian: '#060608',
    slate: '#0c0c0f',
    surface: '#121216',
    elevated: '#1a1a20',

    // Accent Spectrum — Premium indigo-violet
    accent: '#6366f1',
    accentBright: '#818cf8',
    accentSoft: '#a5b4fc',
    accentGlow: 'rgba(99, 102, 241, 0.25)',
    accentPulse: 'rgba(99, 102, 241, 0.08)',

    // Secondary Accents
    pink: '#f472b6',
    pinkGlow: 'rgba(244, 114, 182, 0.2)',
    cyan: '#22d3ee',
    cyanGlow: 'rgba(34, 211, 238, 0.2)',
    gold: '#fbbf24',
    goldGlow: 'rgba(251, 191, 36, 0.2)',

    // Text Hierarchy
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.65)',
    textTertiary: 'rgba(255, 255, 255, 0.4)',
    textDisabled: 'rgba(255, 255, 255, 0.2)',

    // Borders & Glass
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    borderDim: 'rgba(255, 255, 255, 0.08)',
    borderBright: 'rgba(255, 255, 255, 0.15)',
    glass: 'rgba(255, 255, 255, 0.03)',
    glassMedium: 'rgba(255, 255, 255, 0.06)',
    glassBright: 'rgba(255, 255, 255, 0.1)',

    // Status Colors
    success: '#10b981',
    successGlow: 'rgba(16, 185, 129, 0.2)',
    warning: '#f59e0b',
    warningGlow: 'rgba(245, 158, 11, 0.2)',
    danger: '#ef4444',
    dangerGlow: 'rgba(239, 68, 68, 0.2)',

    // Gradients (as arrays for LinearGradient)
    gradientAccent: ['#6366f1', '#8b5cf6', '#a855f7'] as const,
    gradientPremium: ['#6366f1', '#ec4899'] as const,
    gradientSunset: ['#f97316', '#ec4899', '#8b5cf6'] as const,
    gradientOcean: ['#06b6d4', '#3b82f6', '#8b5cf6'] as const,
};

export const typography = {
    // Display — Hero text
    displayLarge: {
        fontSize: 48,
        fontWeight: '900' as const,
        letterSpacing: -2,
        lineHeight: 52,
    },
    displayMedium: {
        fontSize: 36,
        fontWeight: '800' as const,
        letterSpacing: -1.5,
        lineHeight: 42,
    },
    displaySmall: {
        fontSize: 28,
        fontWeight: '800' as const,
        letterSpacing: -1,
        lineHeight: 34,
    },

    // Headlines
    headlineLarge: {
        fontSize: 24,
        fontWeight: '700' as const,
        letterSpacing: -0.5,
        lineHeight: 30,
    },
    headlineMedium: {
        fontSize: 20,
        fontWeight: '700' as const,
        letterSpacing: -0.3,
        lineHeight: 26,
    },
    headlineSmall: {
        fontSize: 17,
        fontWeight: '600' as const,
        letterSpacing: -0.2,
        lineHeight: 22,
    },

    // Body
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 24,
    },
    bodyMedium: {
        fontSize: 14,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 20,
    },
    bodySmall: {
        fontSize: 12,
        fontWeight: '400' as const,
        letterSpacing: 0.1,
        lineHeight: 16,
    },

    // Labels
    labelLarge: {
        fontSize: 14,
        fontWeight: '600' as const,
        letterSpacing: 0.3,
        lineHeight: 20,
    },
    labelMedium: {
        fontSize: 12,
        fontWeight: '600' as const,
        letterSpacing: 0.5,
        lineHeight: 16,
    },
    labelSmall: {
        fontSize: 10,
        fontWeight: '700' as const,
        letterSpacing: 0.8,
        lineHeight: 14,
        textTransform: 'uppercase' as const,
    },

    // Mono (for numbers/stats)
    mono: {
        fontFamily: 'JetBrains Mono',
    },
};

export const spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
    huge: 80,
};

export const radii = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
};

export const grid = 8;

// Premium Motion System
export const motion = {
    // Spring configs for react-native-reanimated/Animated
    smooth: { damping: 20, stiffness: 100, mass: 1 },
    snappy: { damping: 25, stiffness: 200, mass: 0.8 },
    bouncy: { damping: 12, stiffness: 180, mass: 1 },
    gentle: { damping: 30, stiffness: 80, mass: 1.2 },
    // Mobile-optimized ultra-smooth configs for 60fps
    ultraSmooth: { damping: 25, stiffness: 120, mass: 0.8 },
    instant: { damping: 30, stiffness: 300, mass: 0.5 },
    // Gesture-based timing for velocity-driven animations
    gesture: { damping: 28, stiffness: 150, mass: 0.7 },

    // Timing durations
    duration: {
        instant: 100,
        fast: 200,
        normal: 350,
        slow: 500,
        glacial: 800,
    },

    // Easing curves
    easing: {
        smooth: [0.16, 1, 0.3, 1],
        bounce: [0.34, 1.56, 0.64, 1],
        snap: [0.2, 0, 0, 1],
    },
};

// Shadow system
export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 16,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    }),
};

// Haptic feedback types
export const haptics = {
    light: 'light' as const,
    medium: 'medium' as const,
    heavy: 'heavy' as const,
    success: 'success' as const,
    warning: 'warning' as const,
    error: 'error' as const,
    selection: 'selection' as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE GAME OPTIMIZATIONS
// Touch targets & adaptive motion for different device states
// ═══════════════════════════════════════════════════════════════════════════

// Touch target minimums (Apple HIG / Material Design)
export const touchTargets = {
    minimum: 44, // Apple HIG minimum
    comfortable: 48, // Android recommended
    large: 56, // Accessibility-friendly
};

// Adaptive motion presets based on device thermal/battery state
export const adaptiveMotion = {
    // Full quality - nominal thermal, good battery
    highQuality: {
        smooth: { damping: 20, stiffness: 100, mass: 1 },
        snappy: { damping: 25, stiffness: 200, mass: 0.8 },
        bouncy: { damping: 12, stiffness: 180, mass: 1 },
        duration: { fast: 200, normal: 350, slow: 500 },
    },
    // Balanced - fair thermal or moderate battery
    balanced: {
        smooth: { damping: 25, stiffness: 150, mass: 0.8 },
        snappy: { damping: 30, stiffness: 250, mass: 0.6 },
        bouncy: { damping: 18, stiffness: 200, mass: 0.8 },
        duration: { fast: 150, normal: 250, slow: 350 },
    },
    // Low power - serious thermal or low battery
    lowPower: {
        smooth: { damping: 30, stiffness: 200, mass: 0.5 },
        snappy: { damping: 35, stiffness: 300, mass: 0.4 },
        bouncy: { damping: 25, stiffness: 250, mass: 0.5 },
        duration: { fast: 100, normal: 150, slow: 200 },
    },
};

// Get motion preset based on quality level (1.0 = high, 0.5 = balanced, 0.3 = low)
export function getMotionPreset(qualityLevel: number) {
    if (qualityLevel >= 0.8) return adaptiveMotion.highQuality;
    if (qualityLevel >= 0.5) return adaptiveMotion.balanced;
    return adaptiveMotion.lowPower;
}
