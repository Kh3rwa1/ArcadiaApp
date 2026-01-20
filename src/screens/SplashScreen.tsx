import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, typography, spacing, motion } from '../theme';

const { width, height } = Dimensions.get('window');

interface Props {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
    const logoScale = useRef(new Animated.Value(0.6)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const glowScale = useRef(new Animated.Value(0.3)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textScale = useRef(new Animated.Value(0.8)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Optimized cinematic entrance - faster and smoother (2.5s total)
        Animated.sequence([
            // Initial flash and logo rise (800ms)
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    ...motion.ultraSmooth,
                    useNativeDriver: true,
                }),
                Animated.spring(glowScale, {
                    toValue: 1.5,
                    damping: 18,
                    stiffness: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(glowOpacity, {
                    toValue: 0.8,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
            // Text draw-in with scale (500ms) - native driver compatible
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(textScale, {
                    toValue: 1,
                    ...motion.snappy,
                    useNativeDriver: true,
                }),
            ]),
            // Tagline fade (300ms)
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            // Hold (400ms)
            Animated.delay(400),
        ]).start(() => onComplete());
    }, []);

    return (
        <View style={styles.container}>
            {/* Ambient glow */}
            <Animated.View style={[
                styles.glow,
                {
                    opacity: glowOpacity,
                    transform: [{ scale: glowScale }]
                }
            ]} />

            {/* Logo */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    }
                ]}
            >
                <View style={styles.logo}>
                    <Text style={styles.logoText}>A</Text>
                </View>
            </Animated.View>

            {/* Brand */}
            <Animated.View style={[styles.brandContainer, { opacity: textOpacity, transform: [{ scale: textScale }] }]}>
                <Text style={styles.brandName}>
                    ARCADIA
                </Text>
                <Animated.Text style={[styles.brandTagline, { opacity: taglineOpacity }]}>
                    THE FUTURE OF PLAY
                </Animated.Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.void,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.accentGlow,
    },
    logoContainer: {
        marginBottom: spacing.xl,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 28,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 40,
    },
    logoText: {
        fontSize: 48,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    brandContainer: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 12,
        color: colors.textPrimary,
    },
    brandTagline: {
        ...typography.labelSmall,
        color: colors.textSecondary,
        letterSpacing: 4,
    },
});
