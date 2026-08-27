import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radii, motion, shadows } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';

interface PremiumProps {
  onBack: () => void;
}

const BATTLE_PASS_REWARDS = [
  { level: 1, reward: '50 XP Boost', icon: 'flash', unlocked: true, free: true },
  { level: 5, reward: 'Neon Badge', icon: 'ribbon', unlocked: true, free: true },
  { level: 10, reward: 'Exclusive Theme', icon: 'color-palette', unlocked: false, free: false },
  { level: 15, reward: 'Creator Access', icon: 'create', unlocked: false, free: false },
  { level: 20, reward: 'Legendary Frame', icon: 'shield', unlocked: false, free: false },
  { level: 25, reward: 'Custom Emotes', icon: 'happy', unlocked: false, free: true },
  { level: 30, reward: 'Exclusive Game', icon: 'game-controller', unlocked: false, free: false },
  { level: 50, reward: 'Legend Status', icon: 'trophy', unlocked: false, free: false },
];

const getTiers = (colors: any) => [
  {
    id: 'free',
    name: 'Explorer',
    price: 'Free',
    color: colors.textTertiary,
    gradient: ['#1a1a1a', '#2a2a2a'] as const,
    features: [
      '35+ instant games',
      'Basic stats tracking',
      'Daily streak rewards',
    ],
    current: true,
  },
  {
    id: 'pro',
    name: 'Arcadia Pro',
    price: '$4.99/mo',
    color: colors.accent,
    gradient: colors.gradientAccent,
    features: [
      'Everything in Explorer',
      'Exclusive games first',
      'Premium themes & badges',
      'Advanced analytics',
      'No ads — ever',
      'Priority support',
    ],
    current: false,
    popular: true,
  },
  {
    id: 'legend',
    name: 'Legend',
    price: '$9.99/mo',
    color: colors.gold,
    gradient: ['#F59E0B', '#D97706'] as const,
    features: [
      'Everything in Pro',
      'Create & publish games',
      'Revenue share on plays',
      'Custom profile & creator badge',
      'Beta access to new features',
      'Dedicated creator support',
    ],
    current: false,
  },
];

const TierCard = memo(({ tier, colors }: { tier: ReturnType<typeof getTiers>[0]; colors: any }) => {
  const styles = useMemo(() => StyleSheet.create({
    tierCard: {
      borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderDim,
      backgroundColor: colors.glassMedium, overflow: 'hidden',
    },
    tierPopular: { borderColor: colors.accent, borderWidth: 2 },
    popularBadge: {
      position: 'absolute', top: 0, right: 16, zIndex: 1,
      backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 3,
      borderBottomLeftRadius: radii.sm, borderBottomRightRadius: radii.sm,
    },
    popularText: { ...typography.labelSmall, color: '#FFF', fontWeight: '800', fontSize: 9 },
    tierGradient: { padding: spacing.lg, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
    tierName: { ...typography.headlineSmall, color: '#FFF', fontWeight: '800' },
    tierPrice: { ...typography.displaySmall, color: '#FFF', fontWeight: '900', marginTop: 4 },
    tierFeatures: { padding: spacing.lg, gap: spacing.sm },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...typography.bodyMedium, color: colors.textSecondary },
    tierButton: {
      margin: spacing.lg, marginTop: 0,
      backgroundColor: colors.accent, paddingVertical: spacing.md,
      borderRadius: radii.full, alignItems: 'center',
    },
    tierButtonCurrent: { backgroundColor: colors.glassBright },
    tierButtonText: { ...typography.labelLarge, color: '#FFF', fontWeight: '700' },
    tierButtonTextCurrent: { color: colors.textTertiary },
  }), [colors]);

  return (
    <View style={[styles.tierCard, tier.popular && styles.tierPopular]}>
      {tier.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}
      <LinearGradient
        colors={[...tier.gradient] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tierGradient}
      >
        <Text style={styles.tierName}>{tier.name}</Text>
        <Text style={styles.tierPrice}>{tier.price}</Text>
      </LinearGradient>
      <View style={styles.tierFeatures}>
        {tier.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={tier.color} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.tierButton, tier.current && styles.tierButtonCurrent]}
        activeOpacity={0.8}
      >
        <Text style={[styles.tierButtonText, tier.current && styles.tierButtonTextCurrent]}>
          {tier.current ? 'Current Plan' : 'Upgrade'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const BattlePassItem = memo(({ item, userLevel, colors }: {
  item: typeof BATTLE_PASS_REWARDS[0]; userLevel: number; colors: any;
}) => {
  const isUnlocked = userLevel >= item.level;

  const styles = useMemo(() => StyleSheet.create({
    bpItem: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      marginHorizontal: spacing.lg, marginBottom: spacing.sm,
      padding: spacing.md, borderRadius: radii.lg,
      backgroundColor: colors.glassMedium, borderWidth: 1, borderColor: colors.borderSubtle,
    },
    bpItemUnlocked: { borderColor: colors.accentPulse },
    bpLevel: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.borderDim, alignItems: 'center', justifyContent: 'center',
    },
    bpLevelUnlocked: { backgroundColor: colors.accentGlow },
    bpLevelText: { ...typography.labelMedium, color: colors.textDisabled, fontWeight: '700' },
    bpLevelTextUnlocked: { color: colors.accent },
    bpContent: { flex: 1 },
    bpRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    bpReward: { ...typography.bodyMedium, color: colors.textTertiary },
    bpRewardUnlocked: { color: colors.textPrimary, fontWeight: '600' },
    proBadge: {
      backgroundColor: colors.accentGlow, paddingHorizontal: 6, paddingVertical: 1,
      borderRadius: radii.sm, alignSelf: 'flex-start', marginTop: 3,
      borderWidth: 1, borderColor: colors.accent,
    },
    proBadgeText: { ...typography.labelSmall, color: colors.accent, fontWeight: '800', fontSize: 8 },
  }), [colors]);
  return (
    <View style={[styles.bpItem, isUnlocked && styles.bpItemUnlocked]}>
      <View style={[styles.bpLevel, isUnlocked && styles.bpLevelUnlocked]}>
        <Text style={[styles.bpLevelText, isUnlocked && styles.bpLevelTextUnlocked]}>
          {item.level}
        </Text>
      </View>
      <View style={styles.bpContent}>
        <View style={styles.bpRow}>
          <Ionicons name={item.icon as any} size={16}
            color={isUnlocked ? colors.accent : colors.textDisabled} />
          <Text style={[styles.bpReward, isUnlocked && styles.bpRewardUnlocked]}>
            {item.reward}
          </Text>
        </View>
        {!item.free && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>
      {isUnlocked ? (
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      ) : (
        <Ionicons name="lock-closed" size={16} color={colors.textDisabled} />
      )}
    </View>
  );
});

export default function PremiumScreen({ onBack }: PremiumProps) {
  const { themeId, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [userLevel, setUserLevel] = useState(1);
  const tiers = useMemo(() => getTiers(colors), [colors]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.void },
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    },
    backButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.glassMedium, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.borderDim,
    },
    headerTitle: { ...typography.headlineMedium, color: colors.textPrimary, fontWeight: '800' },
    scrollContent: { paddingBottom: 120 },
    heroSection: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radii.xl, overflow: 'hidden' },
    heroBg: {
      padding: spacing.xl, alignItems: 'center', gap: spacing.md,
      borderRadius: radii.xl,
    },
    heroTitle: { ...typography.displaySmall, color: '#FFF', fontWeight: '900', textAlign: 'center' },
    heroSubtitle: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: 280 },
    sectionTitle: {
      ...typography.headlineSmall, color: colors.textPrimary, fontWeight: '800',
      paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md,
    },
    bpProgress: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingHorizontal: spacing.lg, marginBottom: spacing.md,
    },
    bpProgressLabel: { ...typography.labelSmall, color: colors.textTertiary },
    bpProgressBar: {
      flex: 1, height: 6, backgroundColor: colors.borderDim,
      borderRadius: 3, overflow: 'hidden',
    },
    bpProgressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  }), [colors]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600,
      easing: Easing.bezier(...(motion.easing.smooth as [number, number, number, number])),
      useNativeDriver: true,
    }).start();
    loadLevel();
  }, []);

  const loadLevel = async () => {
    const profile = await userService.getProfile();
    setUserLevel(profile.level);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.void }]}>
      <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />
      {/* Decorative mesh blobs — fixed behind scroll */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: 'absolute', top: -80, left: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: colors.accent, opacity: 0.06, transform: [{ scale: 1.5 }] }} />
        <View style={{ position: 'absolute', bottom: 100, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.gold, opacity: 0.04 }} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Premium</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Hero */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={[...colors.gradientPremium] as any}
                style={styles.heroBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="diamond" size={40} color="#FFF" />
                <Text style={styles.heroTitle}>Unlock Your Full Arcade</Text>
                <Text style={styles.heroSubtitle}>
                  Premium members get exclusive games, no ads, and creator tools
                </Text>
              </LinearGradient>
            </View>

            {/* Tiers */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Your Plan</Text>
            {tiers.map(tier => <TierCard key={tier.id} tier={tier} colors={colors} />)}

            {/* Battle Pass */}
            <Text style={[styles.sectionTitle, { marginTop: spacing.xxl, color: colors.textPrimary }]}>
              Season Pass — Level Rewards
            </Text>
            <View style={styles.bpProgress}>
              <Text style={styles.bpProgressLabel}>Level {userLevel}</Text>
              <View style={styles.bpProgressBar}>
                <View style={[styles.bpProgressFill, {
                  width: `${Math.min((userLevel / 50) * 100, 100)}%`
                }]} />
              </View>
              <Text style={styles.bpProgressLabel}>50</Text>
            </View>
            {BATTLE_PASS_REWARDS.map((item, i) => (
              <BattlePassItem key={i} item={item} userLevel={userLevel} colors={colors} />
            ))}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
