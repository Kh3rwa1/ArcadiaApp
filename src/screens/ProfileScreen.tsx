import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows, motion, touchTargets } from '../theme';
import { userService, UserProfile } from '../services/userService';
import { useWindowDimensions, useIsSmallDevice, useScaleAnimation, useReducedMotion } from '../hooks/useDimensions';

// Achievement definitions with icons and colors
const ACHIEVEMENT_DEFS: Record<string, { name: string; icon: string; color: string }> = {
    pioneer: { name: 'Pioneer', icon: 'medal', color: colors.gold },
    '7d_streak': { name: '7D Blaze', icon: 'flame', color: '#f97316' },
    enthusiast: { name: 'Enthusiast', icon: 'game-controller', color: colors.cyan },
    veteran: { name: 'Veteran', icon: 'shield-checkmark', color: colors.accent },
    dedicated: { name: 'Dedicated', icon: 'diamond', color: colors.pink },
    rising_star: { name: 'Rising Star', icon: 'star', color: colors.gold },
};

// Streak Fire Component with animation - Memoized for performance
const StreakFire = memo(({ streak }: { streak: number }) => {
    const flameAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Continuous flame animation
        const flameLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(flameAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
                Animated.timing(flameAnim, { toValue: 0, duration: 800, easing: Easing.ease, useNativeDriver: true }),
            ])
        );
        flameLoop.start();

        // Glow pulse
        const glowLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
            ])
        );
        glowLoop.start();

        return () => {
            flameLoop.stop();
            glowLoop.stop();
        };
    }, []);

    const flameScale = flameAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
    const flameRotate = flameAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-3deg', '3deg', '-3deg'] });

    return (
        <View style={styles.streakContainer}>
            <LinearGradient
                colors={['rgba(249, 115, 22, 0.2)', 'transparent']}
                style={styles.streakGlow}
            />
            <View style={styles.streakContent}>
                <Animated.View style={{ transform: [{ scale: flameScale }, { rotate: flameRotate }] }}>
                    <Ionicons name="flame" size={48} color="#f97316" />
                </Animated.View>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakLabel}>DAY STREAK</Text>
            </View>
        </View>
    );
});

// Level Progress Bar - Optimized with nativeDriver for scaleX
const LevelProgress = memo(({ xp, level }: { xp: number; level: number }) => {
    const progress = userService.getLevelProgress(xp);
    const animatedScaleX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animatedScaleX, {
            toValue: progress / 100,
            ...motion.ultraSmooth,
            useNativeDriver: true,
        }).start();
    }, [progress]);

    return (
        <View style={styles.levelContainer}>
            <View style={styles.levelHeader}>
                <Text style={styles.levelText}>LEVEL {level}</Text>
                <Text style={styles.xpText}>{userService.formatNumber(xp)} XP</Text>
            </View>
            <View style={styles.levelBarBg}>
                <Animated.View
                    style={[
                        styles.levelBarFill,
                        { transform: [{ scaleX: animatedScaleX }, { translateX: -0.5 }] }
                    ]}
                />
            </View>
        </View>
    );
});

const MenuItem = memo(({ icon, text, onPress, isLast }: { icon: any; text: string; onPress?: () => void, isLast?: boolean }) => {
    const { animatedStyle, handlePressIn, handlePressOut } = useScaleAnimation();

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
        >
            <Animated.View style={[styles.menuItem, isLast && { borderBottomWidth: 0 }, animatedStyle]}>
                <View style={styles.menuIconBox}>
                    <Ionicons name={icon} size={20} color={colors.textSecondary} />
                </View>
                <Text style={styles.menuText}>{text}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
            </Animated.View>
        </TouchableOpacity>
    );
});

interface Props { }

function ProfileScreen({ }: Props) {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const isSmallDevice = useIsSmallDevice();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const statAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

    const loadProfile = useCallback(async () => {
        const userProfile = await userService.getProfile();
        setProfile(userProfile);
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (profile) {
            const easing = Easing.bezier(...(motion.easing.smooth as [number, number, number, number]));
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, easing, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 800, easing, useNativeDriver: true }),
                Animated.stagger(150, statAnims.map(anim =>
                    Animated.spring(anim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
                ))
            ]).start();
        }
    }, [profile]);

    if (!profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />
                <Ionicons name="hourglass-outline" size={40} color={colors.textDisabled} />
            </View>
        );
    }

    const displayedAchievements = profile.achievements
        .filter(id => ACHIEVEMENT_DEFS[id])
        .slice(0, 4)
        .map(id => ({ id, ...ACHIEVEMENT_DEFS[id] }));

    return (
        <View style={styles.container}>
            <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, isSmallDevice && { paddingTop: spacing.md }]}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={Platform.OS !== 'web'}
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                        {/* Profile Header */}
                        <View style={styles.header}>
                            <View style={styles.avatarContainer}>
                                <LinearGradient colors={colors.gradientAccent as any} style={[styles.avatarGradient, isSmallDevice && { width: 90, height: 90 }]}>
                                    <View style={[styles.avatarInner, isSmallDevice && { borderRadius: 42 }]}>
                                        <Text style={[styles.avatarText, isSmallDevice && { fontSize: 28 }]}>{profile.avatarInitials}</Text>
                                    </View>
                                </LinearGradient>
                                <View style={styles.onlineBadge} />
                            </View>

                            <Text style={[typography.displaySmall, { color: colors.textPrimary, marginTop: spacing.md }, isSmallDevice && { fontSize: 24 }]}>
                                {profile.username}
                            </Text>
                            <Text style={[typography.bodyLarge, { color: colors.textSecondary }, isSmallDevice && { fontSize: 16 }]}>
                                Level {profile.level} Operative @ARCADIA
                            </Text>

                            {/* Streak Display */}
                            <StreakFire streak={profile.streak.current} />

                            {/* Level Progress */}
                            <LevelProgress xp={profile.stats.totalXP} level={profile.level} />

                            {/* Stats */}
                            <View style={[styles.statContainer, isSmallDevice && { marginTop: spacing.lg, paddingVertical: spacing.md }]}>
                                {[
                                    { val: userService.formatNumber(profile.stats.totalXP), label: 'XP' },
                                    { val: profile.stats.gamesPlayed.toString(), label: 'Games' },
                                    { val: userService.formatPlayTime(profile.stats.totalPlayTimeMs), label: 'Playtime' },
                                ].map((stat, i) => (
                                    <Animated.View
                                        key={i}
                                        style={[
                                            styles.statItem,
                                            { transform: [{ scale: statAnims[i] }, { translateY: statAnims[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }
                                        ]}
                                    >
                                        <Text style={[styles.statVal, isSmallDevice && { fontSize: 20 }]}>{stat.val}</Text>
                                        <Text style={styles.statLabel}>{stat.label}</Text>
                                    </Animated.View>
                                ))}
                            </View>
                        </View>

                        {/* Achievements */}
                        <View style={[styles.section, isSmallDevice && { marginTop: spacing.xl }]}>
                            <Text style={styles.sectionTitle}>Achievements</Text>
                            {displayedAchievements.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementRow}>
                                    {displayedAchievements.map((ach) => (
                                        <TouchableOpacity key={ach.id} activeOpacity={0.7} style={styles.achievementPill}>
                                            <View style={[styles.achIconBg, { backgroundColor: ach.color + '20' }]}>
                                                <Ionicons name={ach.icon as any} size={16} color={ach.color} />
                                            </View>
                                            <Text style={styles.achievementName}>{ach.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <View style={styles.emptyAchievements}>
                                    <Ionicons name="trophy-outline" size={32} color={colors.textDisabled} />
                                    <Text style={styles.emptyText}>Play games to unlock achievements!</Text>
                                </View>
                            )}
                        </View>

                        {/* Streak Bonus Info */}
                        <View style={styles.section}>
                            <View style={styles.bonusCard}>
                                <LinearGradient
                                    colors={['rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.02)']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                                <View style={styles.bonusRow}>
                                    <Ionicons name="gift" size={24} color="#f97316" />
                                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                                        <Text style={styles.bonusTitle}>Streak Bonus</Text>
                                        <Text style={styles.bonusDesc}>
                                            {profile.streak.current >= 7
                                                ? `You're earning 3x XP! Keep it up!`
                                                : profile.streak.current >= 3
                                                    ? `2x XP bonus active! ${7 - profile.streak.current} days to 3x`
                                                    : `${3 - profile.streak.current} more days to unlock 2x XP`}
                                        </Text>
                                    </View>
                                    <Text style={styles.bonusMultiplier}>
                                        {profile.streak.current >= 7 ? '3x' : profile.streak.current >= 3 ? '2x' : '1x'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Best Record */}
                        {profile.stats.highestScore > 0 && (
                            <View style={styles.section}>
                                <View style={styles.recordCard}>
                                    <Ionicons name="trophy" size={24} color={colors.gold} />
                                    <View style={{ marginLeft: spacing.md }}>
                                        <Text style={styles.recordLabel}>Personal Best</Text>
                                        <Text style={styles.recordValue}>{userService.formatNumber(profile.stats.highestScore)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Actions */}
                        <View style={[styles.section, { marginBottom: 60 }]}>
                            <MenuItem icon="settings-outline" text="Settings" />
                            <MenuItem icon="shield-outline" text="Privacy" isLast />
                        </View>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

export default memo(ProfileScreen);



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.void,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing.xl,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarGradient: {
        width: 110,
        height: 110,
        borderRadius: 55,
        padding: 3,
        ...shadows.lg,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 52,
        backgroundColor: colors.obsidian,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -1,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.success,
        borderWidth: 4,
        borderColor: colors.obsidian,
    },
    streakContainer: {
        marginTop: spacing.xl,
        alignItems: 'center',
        position: 'relative',
    },
    streakGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        top: -10,
    },
    streakContent: {
        alignItems: 'center',
    },
    streakNumber: {
        fontSize: 36,
        fontWeight: '900',
        color: '#f97316',
        marginTop: -8,
    },
    streakLabel: {
        ...typography.labelSmall,
        color: colors.textTertiary,
        letterSpacing: 2,
        marginTop: 2,
    },
    levelContainer: {
        marginTop: spacing.lg,
        width: '100%',
    },
    levelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    levelText: {
        ...typography.labelMedium,
        color: colors.accent,
        fontWeight: '700',
    },
    xpText: {
        ...typography.labelMedium,
        color: colors.textTertiary,
    },
    levelBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    levelBarFill: {
        height: '100%',
        backgroundColor: colors.accent,
        borderRadius: 3,
    },
    statContainer: {
        flexDirection: 'row',
        marginTop: spacing.xl,
        justifyContent: 'space-around',
        width: '100%',
        backgroundColor: colors.glassMedium,
        paddingVertical: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    statItem: {
        alignItems: 'center',
    },
    statVal: {
        ...typography.displaySmall,
        fontSize: 24,
        color: colors.textPrimary,
    },
    statLabel: {
        ...typography.labelSmall,
        color: colors.textTertiary,
        marginTop: spacing.xxs,
    },
    section: {
        marginTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
        ...typography.headlineMedium,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    achievementRow: {
        flexDirection: 'row',
    },
    achievementPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.glassMedium,
        paddingLeft: spacing.xs,
        paddingRight: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: colors.borderDim,
        marginRight: spacing.sm,
        gap: spacing.sm,
    },
    achIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    achievementName: {
        ...typography.labelMedium,
        color: colors.textSecondary,
    },
    emptyAchievements: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        backgroundColor: colors.glassMedium,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        gap: spacing.sm,
    },
    emptyText: {
        ...typography.bodyMedium,
        color: colors.textTertiary,
    },
    bonusCard: {
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(249, 115, 22, 0.3)',
        overflow: 'hidden',
        padding: spacing.lg,
    },
    bonusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bonusTitle: {
        ...typography.labelLarge,
        color: colors.textPrimary,
    },
    bonusDesc: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: 2,
    },
    bonusMultiplier: {
        fontSize: 28,
        fontWeight: '900',
        color: '#f97316',
    },
    recordCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.glassMedium,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    recordLabel: {
        ...typography.labelSmall,
        color: colors.textTertiary,
    },
    recordValue: {
        ...typography.displaySmall,
        color: colors.gold,
        fontSize: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: touchTargets.minimum, // Ensure 44pt touch target per Apple HIG
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        gap: spacing.md,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: colors.glassMedium,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        flex: 1,
        ...typography.bodyLarge,
        color: colors.textPrimary,
    },
});
