import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, radii, motion } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { CATEGORIES, getCategoryConfig } from '../constants/categories';

const ONBOARDING_KEY = 'onboarding_complete';
const PREFERRED_GENRES_KEY = 'preferred_genres';

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.void },
    safeArea: { flex: 1 },
    topBar: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    },
    progressDots: { flexDirection: 'row', gap: spacing.sm },
    dot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    dotActive: { backgroundColor: colors.accent, width: 24 },
    dotDone: { backgroundColor: colors.accentSoft },
    skipButton: { padding: spacing.sm },
    skipText: { ...typography.labelLarge, color: colors.textTertiary },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
    stepContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
    heroIcon: { marginBottom: spacing.xl },
    heroGradient: {
      width: 120, height: 120, borderRadius: 60,
      alignItems: 'center', justifyContent: 'center',
    },
    heroTitle: {
      ...typography.displayLarge, color: colors.textPrimary,
      textAlign: 'center', marginBottom: spacing.md,
    },
    heroSubtitle: {
      ...typography.bodyLarge, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 26, maxWidth: 320,
    },
    featureList: { marginTop: spacing.xxl, gap: spacing.lg, width: '100%' },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    featureIcon: {
      width: 40, height: 40, borderRadius: radii.md,
      backgroundColor: colors.accentPulse, alignItems: 'center', justifyContent: 'center',
    },
    featureText: { ...typography.bodyMedium, color: colors.textSecondary, flex: 1 },
    stepTitle: {
      ...typography.displaySmall, color: colors.textPrimary,
      textAlign: 'center', marginBottom: spacing.sm,
    },
    stepSubtitle: {
      ...typography.bodyLarge, color: colors.textSecondary,
      textAlign: 'center', marginBottom: spacing.xxl, maxWidth: 300,
    },
    genreGrid: {
      flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
      gap: spacing.sm, maxWidth: 360,
    },
    genreChip: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
      borderRadius: radii.full, borderWidth: 1.5,
      borderColor: colors.borderDim, backgroundColor: colors.glassMedium,
    },
    genreEmoji: { fontSize: 18 },
    genreName: { ...typography.labelLarge, color: colors.textSecondary },
    checkBadge: {
      width: 16, height: 16, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    readyStats: {
      flexDirection: 'row', alignItems: 'center', marginTop: spacing.xxl,
      backgroundColor: colors.glassMedium, paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xxl, borderRadius: radii.xl,
      borderWidth: 1, borderColor: colors.borderDim, gap: spacing.xl,
    },
    readyStat: { alignItems: 'center' },
    readyStatValue: {
      ...typography.displaySmall, color: colors.textPrimary, fontWeight: '900',
    },
    readyStatLabel: { ...typography.labelSmall, color: colors.textTertiary, marginTop: 2 },
    readyDivider: { width: 1, height: 40, backgroundColor: colors.borderDim },
    bottomBar: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    ctaButton: { borderRadius: radii.full, overflow: 'hidden' },
    ctaGradient: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingVertical: spacing.md + 4, borderRadius: radii.full,
    },
    ctaText: { ...typography.headlineSmall, color: '#FFF', fontWeight: '800' },
  }), [colors]);

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animateTransition = useCallback((forward: boolean, callback: () => void) => {
    const direction = forward ? -1 : 1;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction * 50, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(-direction * 50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, ...motion.snappy, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const handleNext = async () => {
    if (step < 2) {
      animateTransition(true, () => setStep(s => s + 1));
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      await AsyncStorage.setItem(PREFERRED_GENRES_KEY, JSON.stringify(selectedGenres));
      onComplete();
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const renderStep0 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.heroIcon}>
        <LinearGradient colors={colors.gradientAccent as any} style={styles.heroGradient}>
          <Ionicons name="game-controller" size={56} color="#FFF" />
        </LinearGradient>
      </View>
      <Text style={styles.heroTitle}>Welcome to{'\n'}Arcadia</Text>
      <Text style={styles.heroSubtitle}>
        Swipe through an infinite arcade of instant games.{'\n'}No downloads. No friction. Just play.
      </Text>
      <View style={styles.featureList}>
        {[
          { icon: 'flash', text: 'Instant play — games load in under 400ms' },
          { icon: 'swap-vertical', text: 'Swipe to discover — TikTok-style feed' },
          { icon: 'trophy', text: 'Track your stats — XP, streaks, achievements' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={18} color={colors.accent} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What do you like to play?</Text>
      <Text style={styles.stepSubtitle}>
        Pick your favorite genres. We'll personalize your feed.
      </Text>
      <View style={styles.genreGrid}>
        {CATEGORIES.filter(c => c.id !== 'all').map(genre => {
          const isSelected = selectedGenres.includes(genre.id);
          const catConfig = getCategoryConfig(genre.id);
          const accentColor = catConfig.gradient[0];
          return (
            <TouchableOpacity
              key={genre.id}
              style={[
                styles.genreChip,
                isSelected && { borderColor: accentColor, backgroundColor: accentColor + '18' },
              ]}
              onPress={() => toggleGenre(genre.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.genreEmoji}>{genre.emoji}</Text>
              <Text style={[styles.genreName, isSelected && { color: accentColor }]}>
                {genre.name}
              </Text>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: accentColor }]}>
                  <Ionicons name="checkmark" size={10} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.heroIcon}>
        <LinearGradient colors={colors.gradientPremium as any} style={styles.heroGradient}>
          <Ionicons name="rocket" size={56} color="#FFF" />
        </LinearGradient>
      </View>
      <Text style={styles.heroTitle}>You're all set!</Text>
      <Text style={styles.heroSubtitle}>
        Your personalized arcade is ready.{'\n'}Swipe up to start playing.
      </Text>
      <View style={styles.readyStats}>
        <View style={styles.readyStat}>
          <Text style={styles.readyStatValue}>35+</Text>
          <Text style={styles.readyStatLabel}>Games</Text>
        </View>
        <View style={styles.readyDivider} />
        <View style={styles.readyStat}>
          <Text style={styles.readyStatValue}>8</Text>
          <Text style={styles.readyStatLabel}>Genres</Text>
        </View>
        <View style={styles.readyDivider} />
        <View style={styles.readyStat}>
          <Text style={styles.readyStatValue}>∞</Text>
          <Text style={styles.readyStatLabel}>Fun</Text>
        </View>
      </View>
    </View>
  );

  const steps = [renderStep0, renderStep1, renderStep2];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* Skip */}
        <View style={styles.topBar}>
          <View style={styles.progressDots}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
            ))}
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
            {steps[step]()}
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient
              colors={step === 2 ? (colors.gradientPremium as any) : (colors.gradientAccent as any)}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.ctaText}>
                {step === 0 ? "Let's Go" : step === 1 ? 'Continue' : 'Start Playing'}
              </Text>
              <Ionicons name={step === 2 ? 'rocket' : 'arrow-forward'} size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function getPreferredGenres(): Promise<string[]> {
  const data = await AsyncStorage.getItem(PREFERRED_GENRES_KEY);
  return data ? JSON.parse(data) : [];
}
