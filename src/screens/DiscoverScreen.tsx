import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, Image, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows, motion } from '../theme';
import { useWindowDimensions, useIsSmallDevice, useScaleAnimation } from '../hooks/useDimensions';

const TRENDING = [
    { id: 'arcadia-bird', title: 'Arcadia Bird', plays: '124k', color: '#3B82F6' },
    { id: 'neon-uuid', title: 'Neon Clicker', plays: '98k', color: '#06B6D4' },
    { id: 'arcadia-blocks', title: 'Arcadia Blocks', plays: '82k', color: '#F43F5E' },
];

const RECENT_DROPS = [
    { id: 'dot-hunter', title: 'Dot Hunter', category: 'Action', type: 'game' },
    { id: 'color-match', title: 'Color Match', category: 'Puzzle', type: 'game' },
    { id: 'gravity-jump', title: 'Gravity Jump', category: 'Action', type: 'game' },
];

interface DiscoverProps {
    onLaunchGame: (gameId: string) => void;
}

const TrendingCard = memo(({ item, onLaunchGame, screenWidth }: { item: any; onLaunchGame: (id: string) => void, screenWidth: number }) => {
    const { animatedStyle, handlePressIn, handlePressOut } = useScaleAnimation();

    return (
        <TouchableOpacity
            key={item.id}
            activeOpacity={1}
            style={[styles.trendingCard, { width: screenWidth * 0.8 }]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onLaunchGame(item.id)}
        >
            <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                    style={styles.trendingGradient}
                >
                    <View style={[styles.glow, { backgroundColor: item.color }]} />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <View style={styles.statsRow}>
                            <Ionicons name="play" size={12} color={colors.textTertiary} />
                            <Text style={styles.cardStats}>{item.plays} plays</Text>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>
        </TouchableOpacity>
    );
});

const DropItem = memo(({ drop, onLaunchGame }: { drop: any, onLaunchGame: (id: string) => void }) => {
    const { animatedStyle, handlePressIn, handlePressOut } = useScaleAnimation();

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onLaunchGame(drop.id)}
            style={styles.dropItem}
        >
            <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                <BlurView intensity={20} tint="dark" style={styles.dropBlur}>
                    <View style={styles.dropIcon}>
                        <Ionicons name="flash-outline" size={24} color={colors.textPrimary} />
                    </View>
                    <View>
                        <Text style={styles.dropTitle}>{drop.title}</Text>
                        <Text style={styles.dropCategory}>{drop.category}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} style={styles.dropArrow} />
                </BlurView>
            </Animated.View>
        </TouchableOpacity>
    );
});

function DiscoverScreen({ onLaunchGame }: DiscoverProps) {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const isSmallDevice = useIsSmallDevice();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        const easing = Easing.bezier(...(motion.easing.smooth as [number, number, number, number]));
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: motion.duration.slow,
                easing,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: motion.duration.slow,
                easing,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.obsidian, colors.void]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, isSmallDevice && { paddingHorizontal: spacing.md }]}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={Platform.OS !== 'web'}
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        {/* Featured Header */}
                        <View style={[styles.header, isSmallDevice && { marginBottom: spacing.lg }]}>
                            <Text style={[typography.displaySmall, { color: colors.textPrimary }, isSmallDevice && { fontSize: 24 }]}>Discover</Text>
                            <TouchableOpacity style={styles.notificationBtn}>
                                <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                                <View style={styles.badge} />
                            </TouchableOpacity>
                        </View>

                        {/* Trending Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, isSmallDevice && { fontSize: 18 }]}>Trending Now</Text>
                                <Ionicons name="trending-up" size={18} color={colors.accentBright} />
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={SCREEN_WIDTH * 0.8 + spacing.md}
                                decelerationRate="fast"
                                contentContainerStyle={{ paddingRight: spacing.lg }}
                                removeClippedSubviews={Platform.OS !== 'web'}
                            >
                                {TRENDING.map((item) => (
                                    <TrendingCard key={item.id} item={item} onLaunchGame={onLaunchGame} screenWidth={SCREEN_WIDTH} />
                                ))}
                            </ScrollView>
                        </View>

                        {/* Recent Drops */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, isSmallDevice && { fontSize: 18 }]}>Latest Experiences</Text>
                            <View style={styles.dropsGrid}>
                                {RECENT_DROPS.map((drop) => (
                                    <DropItem key={drop.id} drop={drop} onLaunchGame={onLaunchGame} />
                                ))}
                            </View>
                        </View>

                        {/* Community Spotlight */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, isSmallDevice && { fontSize: 18 }]}>Global Arena</Text>
                            <LinearGradient
                                colors={['#8B5CF6', '#6366F1']}
                                style={styles.spotlightCard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.spotlightContent}>
                                    <Text style={[styles.spotlightTitle, isSmallDevice && { fontSize: 20 }]}>Weekly Challenge</Text>
                                    <Text style={[styles.spotlightDesc, isSmallDevice && { fontSize: 14 }]}>Neon Nebula: Reach Top 1% to earn the "Void Walker" badge.</Text>
                                    <TouchableOpacity style={styles.spotlightBtn}>
                                        <Text style={styles.spotlightBtnText}>Join Now</Text>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

export default memo(DiscoverScreen);

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
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: radii.full,
        backgroundColor: colors.glassMedium,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderDim,
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accentBright,
    },
    section: {
        marginBottom: spacing.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.headlineMedium,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    trendingCard: {
        height: 140,
        marginRight: spacing.md,
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    trendingGradient: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'flex-end',
    },
    glow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        opacity: 0.15,
        transform: [{ scale: 1.5 }],
    },
    cardContent: {
        marginTop: 'auto',
    },
    cardTitle: {
        ...typography.headlineSmall,
        color: colors.textPrimary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    cardStats: {
        ...typography.labelSmall,
        color: colors.textTertiary,
    },
    dropsGrid: {
        gap: spacing.sm,
    },
    dropItem: {
        height: 80,
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderDim,
    },
    dropBlur: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
    },
    dropIcon: {
        width: 48,
        height: 48,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    dropTitle: {
        ...typography.bodyLarge,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    dropCategory: {
        ...typography.labelSmall,
        color: colors.textTertiary,
    },
    dropArrow: {
        marginLeft: 'auto',
    },
    spotlightCard: {
        borderRadius: radii.xl,
        padding: spacing.xl,
        ...shadows.lg,
    },
    spotlightContent: {
        flex: 1,
    },
    spotlightTitle: {
        ...typography.headlineMedium,
        color: '#FFF',
        marginBottom: spacing.xs,
    },
    spotlightDesc: {
        ...typography.bodyMedium,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: spacing.lg,
    },
    spotlightBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radii.full,
        alignSelf: 'flex-start',
    },
    spotlightBtnText: {
        ...typography.labelLarge,
        color: '#000',
        fontWeight: '900',
    },
});


