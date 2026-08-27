import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../constants/categories';
import { typography, spacing, radii } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
    selectedCategory: string;
    onSelect: (categoryId: string) => void;
}

export default function CategorySelector({ selectedCategory, onSelect }: Props) {
    const { colors } = useTheme();
    const handlePress = useCallback((id: string) => {
        onSelect(id);
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [onSelect]);

    const styles = useMemo(() => StyleSheet.create({
        wrapper: {
            position: 'absolute',
            bottom: 90,
            left: 0,
            right: 0,
            zIndex: 50,
        },
        container: {
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
            flexDirection: 'row',
        },
        pill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.full,
            backgroundColor: colors.glassMedium,
            borderWidth: 1,
            borderColor: colors.borderDim,
        },
        pillActive: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
        },
        pillText: {
            ...typography.labelMedium,
            color: colors.textTertiary,
        },
        pillTextActive: {
            color: colors.void,
            fontWeight: '700',
        },
    }), [colors]);

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {CATEGORIES.map(cat => {
                    const isActive = cat.id === selectedCategory;
                    return (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.pill,
                                isActive && styles.pillActive,
                            ]}
                            onPress={() => handlePress(cat.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={cat.icon as any}
                                size={14}
                                color={isActive ? colors.void : colors.textTertiary}
                            />
                            <Text style={[
                                styles.pillText,
                                isActive && styles.pillTextActive,
                            ]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}
