import React, { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radii, shadows, motion } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useWindowDimensions } from '../hooks/useDimensions';
import { Game } from '../types';
import { CATEGORIES, getCategoryConfig } from '../constants/categories';
import { api } from '../services/api';
import { userService } from '../services/userService';
import { shareService } from '../services/shareService';

interface DiscoverProps {
  onLaunchGame: (gameId: string) => void;
}

// Featured Hero Card
const HeroCard = memo(({ game, onPress }: { game: Game; onPress: () => void }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const styles = useMemo(() => StyleSheet.create({
    heroCard: {
      borderRadius: radii.xl, overflow: 'hidden',
      height: 200, justifyContent: 'flex-end', ...shadows.lg,
      borderWidth: 1, borderColor: colors.borderDim,
    },
    heroContent: { padding: spacing.lg },
    heroBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.accentGlow, paddingHorizontal: spacing.sm,
      paddingVertical: 3, borderRadius: radii.full, alignSelf: 'flex-start',
      marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.accent,
    },
    heroBadgeText: { ...typography.labelSmall, color: colors.accent, fontWeight: '800', fontSize: 10 },
    heroTitle: { ...typography.displaySmall, color: '#FFF', fontWeight: '900' },
    heroDescription: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    heroStats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
    heroStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    heroStatText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.7)' },
    heroPlayButton: { position: 'absolute', right: spacing.lg, top: spacing.lg },
    heroPlayGradient: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center', ...shadows.md,
    },
  }), [colors]);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, ...motion.snappy, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, ...motion.snappy, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.heroCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#1a1a3e', '#2d1b69', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="trending-up" size={12} color={colors.accent} />
            <Text style={styles.heroBadgeText}>#1 TRENDING</Text>
          </View>
          <Text style={styles.heroTitle}>{game.title}</Text>
          <Text style={styles.heroDescription} numberOfLines={2}>
            {game.description || 'Jump into this trending experience'}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Ionicons name="play" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{(game.plays || 0).toLocaleString()} plays</Text>
            </View>
            <View style={styles.heroStat}>
              <Ionicons name="heart" size={14} color={colors.pink} />
              <Text style={styles.heroStatText}>{(game.likes || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>
        <View style={styles.heroPlayButton}>
          <LinearGradient colors={['#FFF', '#E5E8F0']} style={styles.heroPlayGradient}>
            <Ionicons name="play" size={24} color="#000" />
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// Trending Card (horizontal scroll)
const TrendingCard = memo(({ game, rank, onPress }: { game: Game; rank: number; onPress: () => void }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    trendingCard: { width: 140, marginRight: spacing.md },
    trendingBg: { borderRadius: radii.lg, padding: spacing.md, height: 160, justifyContent: 'space-between' },
    trendingRank: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    },
    trendingRankText: { ...typography.labelSmall, color: '#FFF', fontWeight: '800', fontSize: 11 },
    trendingTitle: { ...typography.bodyMedium, color: '#FFF', fontWeight: '700', marginTop: spacing.sm },
    trendingCategory: { ...typography.labelSmall, color: 'rgba(255,255,255,0.5)' },
    trendingPlayRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trendingPlays: { ...typography.labelSmall, color: colors.textTertiary },
  }), [colors]);

  return (
    <TouchableOpacity style={styles.trendingCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#151528', '#1a1a3e']}
        style={styles.trendingBg}
      >
        <View style={styles.trendingRank}>
          <Text style={styles.trendingRankText}>{rank}</Text>
        </View>
        <Ionicons name="game-controller" size={28} color={colors.accentBright} />
        <Text style={styles.trendingTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.trendingCategory}>
          {game.category ? game.category.charAt(0).toUpperCase() + game.category.slice(1) : 'Game'}
        </Text>
        <View style={styles.trendingPlayRow}>
          <Ionicons name="play" size={10} color={colors.textTertiary} />
          <Text style={styles.trendingPlays}>{(game.plays || 0).toLocaleString()}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

// New Game Drop Card
const DropCard = memo(({ game, onPress, onShare }: {
  game: Game; onPress: () => void; onShare: () => void
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    dropCard: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      marginBottom: spacing.sm, padding: spacing.sm,
      borderRadius: radii.lg, backgroundColor: colors.glassMedium,
      borderWidth: 1, borderColor: colors.borderSubtle,
    },
    dropThumb: {
      width: 52, height: 52, borderRadius: radii.md,
      alignItems: 'center', justifyContent: 'center',
    },
    dropInfo: { flex: 1 },
    dropBadge: {
      backgroundColor: colors.accentGlow, paddingHorizontal: 6, paddingVertical: 1,
      borderRadius: radii.sm, alignSelf: 'flex-start', marginBottom: 2,
      borderWidth: 1, borderColor: colors.accent,
    },
    dropBadgeText: { ...typography.labelSmall, color: colors.accent, fontWeight: '800', fontSize: 9 },
    dropTitle: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '600' },
    dropMeta: { ...typography.labelSmall, color: colors.textTertiary },
    dropActions: { flexDirection: 'row', gap: spacing.sm },
    dropShareBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.glassBright, alignItems: 'center', justifyContent: 'center',
    },
    dropPlayBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    },
  }), [colors]);

  return (
    <TouchableOpacity style={styles.dropCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['#151528', '#1a1a3e']} style={styles.dropThumb}>
        <Ionicons name="game-controller" size={22} color={colors.accentBright} />
      </LinearGradient>
      <View style={styles.dropInfo}>
        <View style={styles.dropBadge}>
          <Text style={styles.dropBadgeText}>NEW</Text>
        </View>
        <Text style={styles.dropTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.dropMeta}>
          {game.category ? game.category.charAt(0).toUpperCase() + game.category.slice(1) : 'Game'}
          {game.creator ? ` · by ${game.creator}` : ''}
        </Text>
      </View>
      <View style={styles.dropActions}>
        <TouchableOpacity onPress={onShare} style={styles.dropShareBtn}>
          <Ionicons name="share-outline" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onPress} style={styles.dropPlayBtn}>
          <Ionicons name="play" size={14} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// Category Spotlight Card
const SpotlightCard = memo(({ category, count, gradient, icon, onPress }: {
  category: string; count: number; gradient: readonly [string, string]; icon: string; onPress: () => void;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    spotlightCard: { width: 120, marginRight: spacing.md },
    spotlightGradient: {
      borderRadius: radii.lg, padding: spacing.md, height: 120,
      justifyContent: 'flex-end',
    },
    spotlightName: { ...typography.bodyMedium, color: '#FFF', fontWeight: '700' },
    spotlightCount: { ...typography.labelSmall, color: 'rgba(255,255,255,0.7)' },
  }), [colors]);

  return (
    <TouchableOpacity style={styles.spotlightCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={[...gradient] as any} style={styles.spotlightGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon as any} size={24} color="#FFF" />
        <Text style={styles.spotlightName}>{category}</Text>
        <Text style={styles.spotlightCount}>{count} games</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
});

export default function DiscoverScreen({ onLaunchGame }: DiscoverProps) {
  const { themeId, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [allGames, setAllGames] = useState<Game[]>([]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.void },
    safeArea: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    header: { padding: spacing.lg, paddingBottom: spacing.md },
    headerTitle: { ...typography.displaySmall, color: colors.textPrimary, fontWeight: '900' },
    headerSubtitle: { ...typography.bodyMedium, color: colors.textTertiary, marginTop: spacing.xs },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.md,
    },
    sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, fontWeight: '800' },
    horizontalScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    spotlightGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm },
  }), [colors]);

  useEffect(() => {
    const easing = Easing.bezier(...motion.easing.smooth as [number, number, number, number]);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing, useNativeDriver: true }),
    ]).start();
    loadGames();
  }, []);

  const loadGames = async () => {
    const games = await api.getFeed();
    setAllGames(games);
  };

  // Algorithm: Most played games = trending
  const trending = useMemo(() =>
    [...allGames].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 8),
    [allGames]
  );

  // Algorithm: Newest games (last in catalog = most recently added)
  const newDrops = useMemo(() =>
    [...allGames].reverse().slice(0, 6),
    [allGames]
  );

  // Hero: Top trending game
  const heroGame = trending[0];

  // Category stats
  const categories = useMemo(() => {
    const map: Record<string, { count: number; gradient: readonly [string, string]; icon: string }> = {};
    for (const cat of CATEGORIES) {
      if (cat.id === 'all') continue;
      map[cat.id] = { count: 0, gradient: getCategoryConfig(cat.id).gradient, icon: cat.icon };
    }
    allGames.forEach(g => {
      const cat = g.category?.toLowerCase();
      if (cat && map[cat]) map[cat].count++;
    });
    return Object.entries(map).filter(([, v]) => v.count > 0);
  }, [allGames]);

  const handleShare = (game: Game) => shareService.shareGame(game.title, game.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.void }]}>
      <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />
      {/* Decorative mesh blobs — fixed behind scroll */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: 'absolute', top: -90, right: -40, width: 300, height: 300, borderRadius: 150, backgroundColor: colors.accent, opacity: 0.06, transform: [{ scale: 1.6 }] }} />
        <View style={{ position: 'absolute', bottom: 120, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.pink, opacity: 0.04 }} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Discover</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Your next favorite game is here</Text>
            </View>

            {/* Hero Featured */}
            {heroGame && (
              <HeroCard game={heroGame} onPress={() => onLaunchGame(heroGame.id)} />
            )}

            {/* Trending */}
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trending Now</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}>
              {trending.slice(1).map((game, i) => (
                <TrendingCard key={game.id} game={game} rank={i + 2}
                  onPress={() => onLaunchGame(game.id)} />
              ))}
            </ScrollView>

            {/* Category Spotlight */}
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={18} color={colors.gold} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Browse by Genre</Text>
            </View>
            <View style={styles.spotlightGrid}>
              {categories.map(([name, data]) => (
                <SpotlightCard
                  key={name}
                  category={name.charAt(0).toUpperCase() + name.slice(1)}
                  count={data.count}
                  gradient={data.gradient}
                  icon={data.icon}
                  onPress={() => onLaunchGame(allGames.find(g => g.category?.toLowerCase() === name)?.id || '')}
                />
              ))}
            </View>

            {/* New Drops */}
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={18} color={colors.pink} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>New Drops</Text>
            </View>
            {newDrops.map(game => (
              <DropCard key={game.id} game={game}
                onPress={() => onLaunchGame(game.id)}
                onShare={() => handleShare(game)} />
            ))}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
