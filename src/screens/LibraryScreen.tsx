import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, TextInput, Dimensions, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows, motion } from '../theme';
import { useWindowDimensions } from '../hooks/useDimensions';

const CATEGORIES = [
    { id: 'arcade', name: 'Arcade', icon: 'game-controller', gradient: ['#6366F1', '#4F46E5'] as const },
    { id: 'puzzle', name: 'Puzzle', icon: 'extension-puzzle', gradient: ['#8B5CF6', '#7C3AED'] as const },
    { id: 'action', name: 'Action', icon: 'flash', gradient: ['#F43F5E', '#E11D48'] as const },
    { id: 'zen', name: 'Zen', icon: 'leaf', gradient: ['#10B981', '#059669'] as const },
    { id: 'brain', name: 'Brain', icon: 'brain', gradient: ['#F59E0B', '#D97706'] as const },
    { id: 'endless', name: 'Endless', icon: 'infinite', gradient: ['#3B82F6', '#2563EB'] as const },
];

interface LibraryProps {
    onSelectCategory: (categoryId: string) => void;
    onLaunchGame: (gameId: string) => void;
}

export default function LibraryScreen({ onSelectCategory, onLaunchGame }: LibraryProps) {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const categoryAnims = useRef(CATEGORIES.map(() => new Animated.Value(0))).current;
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const easing = Easing.bezier(...motion.easing.smooth as [number, number, number, number]);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                easing,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing,
                useNativeDriver: true,
            }),
            Animated.stagger(100, categoryAnims.map(anim =>
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 500,
                    easing,
                    useNativeDriver: true,
                })
            ))
        ]).start();
    }, []);

    const onSearchFocus = () => {
        setIsSearchFocused(true);
        Animated.spring(searchScale, {
            toValue: 1.02,
            ...motion.snappy,
            useNativeDriver: true,
        }).start();
    };

    const onSearchBlur = () => {
        setIsSearchFocused(false);
        Animated.spring(searchScale, {
            toValue: 1,
            ...motion.snappy,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.obsidian, colors.void]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={[typography.displaySmall, { color: colors.textPrimary }]}>Library</Text>
                        <Text style={[typography.bodyLarge, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                            Curated experiences
                        </Text>
                    </Animated.View>

                    <Animated.View style={[
                        styles.searchContainer,
                        {
                            transform: [{ scale: searchScale }],
                            borderColor: isSearchFocused ? colors.accentBright : colors.borderDim,
                            backgroundColor: isSearchFocused ? 'rgba(255,255,255,0.08)' : colors.glassMedium
                        }
                    ]}>
                        <Ionicons name="search" size={20} color={isSearchFocused ? colors.accentBright : colors.textTertiary} />
                        <TextInput
                            placeholder="Find your reality..."
                            placeholderTextColor={colors.textTertiary}
                            style={styles.searchInput}
                            onFocus={onSearchFocus}
                            onBlur={onSearchBlur}
                        />
                    </Animated.View>

                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map((cat, index) => (
                            <Animated.View
                                key={cat.id}
                                style={[
                                    styles.categoryWrapper,
                                    {
                                        opacity: categoryAnims[index],
                                        transform: [
                                            { scale: categoryAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
                                            { translateY: categoryAnims[index].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }
                                        ]
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.categoryTouchable}
                                    onPress={() => onSelectCategory(cat.id)}
                                >
                                    <LinearGradient
                                        colors={cat.gradient as any}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.categoryCard}
                                    >
                                        <View style={styles.iconContainer}>
                                            <Ionicons name={cat.icon as any} size={24} color="#FFF" />
                                        </View>
                                        <Text style={styles.categoryName}>{cat.name}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>

                    <View style={styles.historySection}>
                        <Text style={[typography.headlineMedium, { color: colors.textPrimary, marginBottom: spacing.md }]}>
                            Recents
                        </Text>
                        <View style={styles.historyList}>
                            {[1].map((i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.historyItem}
                                    onPress={() => onLaunchGame('arcadia-bird')}
                                >
                                    <View style={styles.historyThumb} />
                                    <View>
                                        <Text style={styles.historyTitle}>Arcadia Bird</Text>
                                        <Text style={styles.historyMeta}>Last played 2h ago</Text>
                                    </View>
                                    <Ionicons name="play-circle-outline" size={24} color={colors.accentBright} style={styles.historyIcon} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.void,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    header: {
        marginBottom: spacing.xl,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        height: 56,
        borderWidth: 1,
        marginBottom: spacing.xl,
        ...shadows.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        color: colors.textPrimary,
        ...typography.bodyLarge,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    categoryWrapper: {
        height: 140,
    },
    categoryTouchable: {
        flex: 1,
    },
    categoryCard: {
        flex: 1,
        borderRadius: radii.xl,
        padding: spacing.md,
        justifyContent: 'space-between',
        ...shadows.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryName: {
        ...typography.headlineSmall,
        color: '#FFF',
    },
    historySection: {
        marginTop: spacing.xxl,
    },
    historyList: {
        gap: spacing.sm,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.glassMedium,
        padding: spacing.sm,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    historyThumb: {
        width: 48,
        height: 48,
        borderRadius: radii.md,
        backgroundColor: colors.glassBright,
        marginRight: spacing.md,
    },
    historyTitle: {
        ...typography.bodyLarge,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    historyMeta: {
        ...typography.labelSmall,
        color: colors.textTertiary,
    },
    historyIcon: {
        marginLeft: 'auto',
        marginRight: spacing.xs,
    },
});
