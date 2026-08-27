import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { typography, spacing, radii } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
    onPressDiscover: () => void;
    visible: boolean;
}

export default function MiniGameHeader({ onPressDiscover, visible }: Props) {
    const { colors } = useTheme();
    const styles = useMemo(() => StyleSheet.create({
        button: {
            position: 'absolute',
            top: 60,
            left: spacing.lg,
            zIndex: 100,
            borderRadius: radii.full,
            overflow: 'hidden',
        },
        inner: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: colors.borderBright,
            backgroundColor: colors.glassMedium,
        },
        label: {
            ...typography.labelLarge,
            color: colors.textPrimary,
            fontWeight: '700',
        },
    }), [colors]);

    if (!visible) return null;

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPressDiscover}
            activeOpacity={0.8}
        >
            <BlurView intensity={55} tint="dark" style={styles.inner}>
                <Ionicons name="compass" size={18} color={colors.accentSoft} />
                <Text style={styles.label}>Discover</Text>
                <Ionicons name="sparkles" size={14} color={colors.gold} />
            </BlurView>
        </TouchableOpacity>
    );
}
