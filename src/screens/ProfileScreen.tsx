import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radii, shadows, motion, touchTargets } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { userService, UserProfile } from '../services/userService';
import { useWindowDimensions, useIsSmallDevice, useScaleAnimation, useReducedMotion } from '../hooks/useDimensions';
import { shareService } from '../services/shareService';

const { width: SCREEN_W } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════
// Achievement data — built per-theme
// ═══════════════════════════════════════════════════════════════════
const getAchievementDefs = (colors: any): Record<string, { name: string; icon: string; color: string; gradient: readonly [string, string] }> => ({
  pioneer:     { name: 'Pioneer',     icon: 'medal',            color: colors.gold,   gradient: ['#fbbf24', '#f59e0b'] },
  '7d_streak': { name: '7D Blaze',   icon: 'flame',            color: '#f97316',     gradient: ['#f97316', '#ea580c'] },
  enthusiast:  { name: 'Enthusiast',  icon: 'game-controller',  color: colors.cyan,   gradient: ['#22d3ee', '#06b6d4'] },
  veteran:     { name: 'Veteran',     icon: 'shield-checkmark', color: colors.accent,  gradient: ['#6366f1', '#4f46e5'] },
  dedicated:   { name: 'Dedicated',   icon: 'diamond',          color: colors.pink,   gradient: ['#f472b6', '#ec4899'] },
  rising_star: { name: 'Rising Star', icon: 'star',             color: colors.gold,   gradient: ['#fbbf24', '#d97706'] },
});

// ═══════════════════════════════════════════════════════════════════
// Animated Stat Card
// ═══════════════════════════════════════════════════════════════════
const StatCard = memo(({ value, label, icon, gradient, delay }: {
  value: string; label: string; icon: string; gradient: readonly [string, string]; delay: number;
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const styles = useMemo(() => StyleSheet.create({
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: 6,
    },
    statIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      ...typography.headlineMedium,
      color: colors.textPrimary,
      fontWeight: '900',
      fontSize: 18,
    },
    statLabel: {
      ...typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 9,
    },
  }), [colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, delay,
        easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600, delay,
        easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.statCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statIconWrap}
      >
        <Ionicons name={icon as any} size={16} color="#FFF" />
      </LinearGradient>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Achievement Badge
// ═══════════════════════════════════════════════════════════════════
const AchievementBadge = memo(({ ach, index }: {
  ach: { id: string; name: string; icon: string; color: string; gradient: readonly [string, string] };
  index: number;
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  const styles = useMemo(() => StyleSheet.create({
    achCard: { alignItems: 'center', width: 80 },
    achGradient: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 6, ...shadows.md,
    },
    achName: { ...typography.labelSmall, color: colors.textPrimary, fontWeight: '600', fontSize: 10, textAlign: 'center' },
  }), [colors]);

  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay,
        easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true }),
      Animated.spring(scaleAnim, {
        toValue: 1, delay, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.achCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={ach.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.achGradient}
      >
        <Ionicons name={ach.icon as any} size={24} color="#FFF" />
      </LinearGradient>
      <Text style={styles.achName}>{ach.name}</Text>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Streak Fire — animated flame
// ═══════════════════════════════════════════════════════════════════
const StreakCard = memo(({ streak }: { streak: number }) => {
  const { colors } = useTheme();
  const flameAnim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => StyleSheet.create({
    streakCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(249, 115, 22, 0.2)',
      overflow: 'hidden',
    },
    streakLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    streakNum: {
      fontSize: 32,
      fontWeight: '900',
      color: '#f97316',
      lineHeight: 34,
    },
    streakLabel: {
      ...typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 9,
      letterSpacing: 2,
    },
    streakRight: { alignItems: 'flex-end' },
    streakMultiplier: {
      fontSize: 28,
      fontWeight: '900',
    },
    streakMultiLabel: {
      ...typography.labelSmall,
      color: colors.textTertiary,
      fontSize: 8,
      letterSpacing: 1.5,
    },
  }), [colors]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(flameAnim, { toValue: 0, duration: 800, easing: Easing.ease, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const flameScale = flameAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const flameRotate = flameAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-3deg', '3deg', '-3deg'] });
  const multiplier = streak >= 7 ? '3x' : streak >= 3 ? '2x' : '1x';
  const multiplierColor = streak >= 7 ? '#22d3ee' : streak >= 3 ? '#f97316' : colors.textTertiary;

  return (
    <View style={styles.streakCard}>
      <LinearGradient
        colors={['rgba(249, 115, 22, 0.15)', 'rgba(249, 115, 22, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
      />
      <View style={styles.streakLeft}>
        <Animated.View style={{ transform: [{ scale: flameScale }, { rotate: flameRotate }] }}>
          <Text style={{ fontSize: 36 }}>🔥</Text>
        </Animated.View>
        <View>
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>DAY STREAK</Text>
        </View>
      </View>
      <View style={styles.streakRight}>
        <Text style={[styles.streakMultiplier, { color: multiplierColor }]}>{multiplier}</Text>
        <Text style={styles.streakMultiLabel}>XP BONUS</Text>
      </View>
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════════
// XP Level Bar
// ═══════════════════════════════════════════════════════════════════
const LevelProgress = memo(({ xp, level }: { xp: number; level: number }) => {
  const { colors } = useTheme();
  const progress = userService.getLevelProgress(xp);
  const animatedScaleX = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => StyleSheet.create({
    levelContainer: { width: '100%' },
    levelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    levelBadge: { borderRadius: radii.full, overflow: 'hidden' },
    levelBadgeGrad: {
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    levelBadgeText: {
      ...typography.labelSmall,
      color: '#FFF',
      fontWeight: '800',
      fontSize: 11,
    },
    xpText: {
      ...typography.labelMedium,
      color: colors.textTertiary,
    },
    levelBarBg: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    levelBarFill: {
      height: '100%',
      borderRadius: 4,
      transformOrigin: 'left',
      overflow: 'hidden',
    },
  }), [colors]);

  useEffect(() => {
    Animated.spring(animatedScaleX, {
      toValue: progress / 100, ...motion.ultraSmooth, useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <View style={styles.levelContainer}>
      <View style={styles.levelHeader}>
        <View style={styles.levelBadge}>
          <LinearGradient colors={colors.gradientAccent as any} style={styles.levelBadgeGrad}>
            <Text style={styles.levelBadgeText}>LV {level}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.xpText}>{userService.formatNumber(xp)} XP</Text>
      </View>
      <View style={styles.levelBarBg}>
        <Animated.View style={[styles.levelBarFill, { transform: [{ scaleX: animatedScaleX }] }]}>
          <LinearGradient
            colors={colors.gradientAccent as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Menu Item — premium glass row
// ═══════════════════════════════════════════════════════════════════
const MenuItem = memo(({ icon, text, color, onPress, isLast }: {
  icon: any; text: string; color?: string; onPress?: () => void; isLast?: boolean;
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const styles = useMemo(() => StyleSheet.create({
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDim,
    },
    menuIconBox: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: {
      ...typography.bodyLarge,
      color: colors.textPrimary,
      fontWeight: '600',
      flex: 1,
    },
  }), [colors]);
  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, ...motion.snappy, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, ...motion.snappy, useNativeDriver: true }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.menuItem, isLast && { borderBottomWidth: 0 }, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.menuIconBox, color ? { backgroundColor: color + '18' } : {}]}>
          <Ionicons name={icon} size={20} color={color || colors.textSecondary} />
        </View>
        <Text style={styles.menuText}>{text}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
      </Animated.View>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════════
// MAIN PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════════
interface Props {
  onAdminPress?: () => void;
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
  onPremiumPress?: () => void;
}

function ProfileScreen({ onAdminPress, onSettingsPress, onNotificationsPress, onPremiumPress }: Props) {
  const { themeId, colors } = useTheme();
  const isSmallDevice = useIsSmallDevice();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const loadProfile = useCallback(async () => {
    const userProfile = await userService.getProfile();
    setProfile(userProfile);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSecretAdminAccess = () => {
    if (onAdminPress) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdminPress();
    }
  };

  useEffect(() => {
    if (profile) {
      const easing = Easing.bezier(...(motion.easing.smooth as [number, number, number, number]));
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, easing, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, easing, useNativeDriver: true }),
      ]).start();
    }
  }, [profile]);

  const ACHIEVEMENT_DEFS = useMemo(() => getAchievementDefs(colors), [colors]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.void },
    safeArea: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    heroSection: {
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    heroBg: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.15,
    },
    heroOrb: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
    },
    heroContent: {
      alignItems: 'center',
      zIndex: 2,
    },
    avatarWrap: { position: 'relative' },
    avatarRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      padding: 3,
      ...shadows.lg,
    },
    avatarInner: {
      flex: 1,
      borderRadius: 47,
      backgroundColor: colors.obsidian,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    avatarText: {
      fontSize: 30,
      fontWeight: '900',
      color: '#FFF',
      letterSpacing: -1,
    },
    onlineBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.success,
      borderWidth: 3,
      borderColor: colors.obsidian,
    },
    username: {
      ...typography.displaySmall,
      color: colors.textPrimary,
      fontWeight: '900',
      marginTop: spacing.md,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      marginTop: 2,
    },
    progressSection: {
      paddingHorizontal: spacing.lg,
      marginTop: -spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      gap: 10,
    },
    recordCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(251, 191, 36, 0.2)',
      gap: spacing.md,
      overflow: 'hidden',
    },
    recordIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(251, 191, 36, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordLabel: {
      ...typography.labelSmall,
      color: colors.textTertiary,
    },
    recordValue: {
      ...typography.headlineLarge,
      color: colors.gold,
      fontWeight: '900',
    },
    sectionPadded: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      ...typography.headlineSmall,
      color: colors.textPrimary,
      fontWeight: '800',
    },
    sectionCount: {
      ...typography.labelSmall,
      color: colors.accent,
      backgroundColor: colors.accentPulse,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.accentGlow,
      overflow: 'hidden',
    },
    achGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    emptyAch: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: spacing.sm,
    },
    emptyTitle: {
      ...typography.headlineSmall,
      color: colors.textSecondary,
      fontWeight: '700',
    },
    emptySubtitle: {
      ...typography.bodyMedium,
      color: colors.textTertiary,
    },
    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
    },
  }), [colors]);

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
    .slice(0, 6)
    .map(id => ({ id, ...ACHIEVEMENT_DEFS[id] }));

  return (
    <View style={[styles.container, { backgroundColor: colors.void }]}>
      <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />
      {/* Decorative mesh blobs — fixed behind scroll */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: 'absolute', top: -60, left: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: colors.accent, opacity: 0.07, transform: [{ scale: 1.4 }] }} />
        <View style={{ position: 'absolute', bottom: 80, right: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.pink, opacity: 0.04 }} />
        <View style={{ position: 'absolute', top: '50%', left: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.gold, opacity: 0.03 }} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS !== 'web'}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ─── Hero Header with gradient accent ─── */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={[...colors.gradientAccent, 'transparent'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBg}
              />
              {/* Decorative orbs */}
              <View style={[styles.heroOrb, { top: -30, right: -20, backgroundColor: colors.accent, opacity: 0.12 }]} />
              <View style={[styles.heroOrb, { bottom: 20, left: -40, backgroundColor: colors.pink, opacity: 0.08 }]} />

              <View style={styles.heroContent}>
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                  <LinearGradient colors={colors.gradientPremium as any} style={styles.avatarRing}>
                    <View style={styles.avatarInner}>
                      <Text style={[styles.avatarText, { color: colors.textPrimary }]}>{profile.avatarInitials}</Text>
                    </View>
                  </LinearGradient>
                  <View style={styles.onlineBadge} />
                </View>

                {/* Name & Title */}
                <TouchableOpacity activeOpacity={1} onLongPress={handleSecretAdminAccess} delayLongPress={2000}>
                  <Text style={[styles.username, { color: colors.textPrimary }]}>{profile.username}</Text>
                </TouchableOpacity>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Level {profile.level} Operative @DURRA</Text>
              </View>
            </View>

            {/* ─── Level Progress ─── */}
            <View style={styles.progressSection}>
              <LevelProgress xp={profile.stats.totalXP} level={profile.level} />
            </View>

            {/* ─── Stat Cards ─── */}
            <View style={styles.statsRow}>
              <StatCard
                value={userService.formatNumber(profile.stats.totalXP)}
                label="Total XP" icon="flash" gradient={colors.gradientAccent as unknown as [string, string]} delay={0}
              />
              <StatCard
                value={profile.stats.gamesPlayed.toString()}
                label="Games" icon="game-controller" gradient={['#22d3ee', '#06b6d4']} delay={100}
              />
              <StatCard
                value={userService.formatPlayTime(profile.stats.totalPlayTimeMs)}
                label="Playtime" icon="time" gradient={['#f472b6', '#ec4899']} delay={200}
              />
            </View>

            {/* ─── Streak Card ─── */}
            <View style={styles.sectionPadded}>
              <StreakCard streak={profile.streak.current} />
            </View>

            {/* ─── Personal Best ─── */}
            {profile.stats.highestScore > 0 && (
              <View style={styles.sectionPadded}>
                <View style={styles.recordCard}>
                  <LinearGradient
                    colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.02)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
                  />
                  <View style={styles.recordIconWrap}>
                    <Text style={{ fontSize: 28 }}>🏆</Text>
                  </View>
                  <View>
                    <Text style={[styles.recordLabel, { color: colors.textSecondary }]}>Personal Best</Text>
                    <Text style={[styles.recordValue, { color: colors.textPrimary }]}>{userService.formatNumber(profile.stats.highestScore)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ─── Achievements ─── */}
            <View style={styles.sectionPadded}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="trophy" size={16} color={colors.gold} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Achievements</Text>
                </View>
                <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{displayedAchievements.length}</Text>
              </View>

              {displayedAchievements.length > 0 ? (
                <View style={styles.achGrid}>
                  {displayedAchievements.map((ach, i) => (
                    <AchievementBadge key={ach.id} ach={ach} index={i} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyAch}>
                  <Text style={{ fontSize: 32 }}>🎮</Text>
                  <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No achievements yet</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>Play games to unlock achievements!</Text>
                </View>
              )}
            </View>

            {/* ─── Actions Menu ─── */}
            <View style={styles.sectionPadded}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="menu" size={16} color={colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                </View>
              </View>
              <View style={styles.menuCard}>
                <MenuItem icon="notifications-outline" text="Notifications" color="#6366f1" onPress={onNotificationsPress} />
                <MenuItem icon="diamond-outline" text="Arcadia Premium" color="#f472b6" onPress={onPremiumPress} />
                <MenuItem icon="share-social-outline" text="Share Arcadia" color="#22d3ee" onPress={() => shareService.shareApp()} />
                <MenuItem icon="settings-outline" text="Settings" color="#f59e0b" onPress={onSettingsPress} />
                <MenuItem icon="shield-outline" text="Privacy" color="#10b981" isLast />
              </View>
            </View>

            {/* Bottom spacer */}
            <View style={{ height: 80 }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export default memo(ProfileScreen);
