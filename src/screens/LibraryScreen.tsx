import React, { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity,
  TextInput, Easing, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radii, shadows, motion } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { Game } from '../types';
import { CATEGORIES, getCategoryConfig } from '../constants/categories';
import { api } from '../services/api';
import { userService } from '../services/userService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - spacing.lg * 2 - CARD_GAP) / 2;

interface LibraryProps {
  onSelectCategory: (categoryId: string) => void;
  onLaunchGame: (gameId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════
// Featured Hero Card — top game showcase
// ═══════════════════════════════════════════════════════════════════
const FeaturedCard = memo(({ game, onPress }: { game: Game; onPress: () => void }) => {
  const { colors } = useTheme();
  const cat = getCategoryConfig(game.category);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const styles = useMemo(() => StyleSheet.create({
    featuredCard: {
      height: 200, borderRadius: radii.xl, overflow: 'hidden',
      padding: spacing.lg, justifyContent: 'space-between',
      borderWidth: 1, borderColor: colors.borderBright, ...shadows.md,
    },
    featuredOrb: { position: 'absolute', borderRadius: 200, opacity: 0.25 },
    featuredOrb1: { width: 200, height: 200, top: -60, right: -40 },
    featuredOrb2: { width: 150, height: 150, bottom: -30, left: -20 },
    featuredBadgeRow: { flexDirection: 'row', gap: 8, zIndex: 2 },
    featuredBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10,
      paddingVertical: 4, borderRadius: radii.full,
      borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    },
    featuredBadgeText: { ...typography.labelSmall, color: '#FFD700', fontSize: 9 },
    featuredCategoryBadge: {
      backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10,
      paddingVertical: 4, borderRadius: radii.full,
    },
    featuredCategoryText: { ...typography.labelSmall, color: '#FFF', fontSize: 9 },
    featuredBottom: { zIndex: 2 },
    featuredEmoji: { fontSize: 28, marginBottom: 4 },
    featuredTitle: { ...typography.headlineLarge, color: '#FFF', fontWeight: '900' },
    featuredCreator: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    featuredStats: { flexDirection: 'row', gap: 10, marginTop: 8 },
    featuredStatPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 10,
      paddingVertical: 4, borderRadius: radii.full,
    },
    featuredStatText: {
      ...typography.labelSmall, color: '#FFF', fontSize: 10,
      fontWeight: '600', textTransform: 'none',
    },
    featuredPlayBtn: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, zIndex: 3 },
    featuredPlayGrad: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center', ...shadows.md,
    },
  }), [colors]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, ...motion.snappy, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, ...motion.snappy, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.featuredCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={[...cat.gradient, 'rgba(0,0,0,0.6)'] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Decorative orbs */}
        <View style={[styles.featuredOrb, styles.featuredOrb1, { backgroundColor: cat.gradient[0] }]} />
        <View style={[styles.featuredOrb, styles.featuredOrb2, { backgroundColor: cat.gradient[1] }]} />

        <View style={styles.featuredBadgeRow}>
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
          <View style={styles.featuredCategoryBadge}>
            <Text style={styles.featuredCategoryText}>{cat.emoji} {(game.category || 'Game').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.featuredBottom}>
          <Text style={styles.featuredEmoji}>{cat.emoji}</Text>
          <Text style={styles.featuredTitle} numberOfLines={1}>{game.title}</Text>
          {game.creator && <Text style={styles.featuredCreator}>by {game.creator}</Text>}
          <View style={styles.featuredStats}>
            <View style={styles.featuredStatPill}>
              <Ionicons name="play" size={12} color="#FFF" />
              <Text style={styles.featuredStatText}>{(game.plays || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.featuredStatPill}>
              <Ionicons name="heart" size={12} color="#F43F5E" />
              <Text style={styles.featuredStatText}>{(game.likes || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Play button */}
        <View style={styles.featuredPlayBtn}>
          <LinearGradient colors={['#FFF', '#E5E7EB'] as any} style={styles.featuredPlayGrad}>
            <Ionicons name="play" size={22} color="#000" />
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Game Card — 2-column grid item with gradient thumbnail
// ═══════════════════════════════════════════════════════════════════
const GameGridCard = memo(({ game, onPress, index }: { game: Game; onPress: () => void; index: number }) => {
  const { colors } = useTheme();
  const cat = getCategoryConfig(game.category);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const styles = useMemo(() => StyleSheet.create({
    gridCard: {
      width: CARD_W, backgroundColor: colors.surface,
      borderRadius: radii.lg, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.borderSubtle, ...shadows.sm,
    },
    gridThumb: {
      width: '100%', height: CARD_W * 0.7,
      alignItems: 'center', justifyContent: 'center',
    },
    gridEmoji: { fontSize: 36 },
    gridPlayOverlay: {
      position: 'absolute', right: 8, bottom: 8,
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    gridInfo: { padding: spacing.sm, paddingTop: 10 },
    gridTitle: {
      ...typography.bodyLarge, color: colors.textPrimary,
      fontWeight: '700', fontSize: 14,
    },
    gridMetaRow: {
      flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4,
    },
    gridCategory: {
      ...typography.labelSmall, color: colors.textTertiary, fontSize: 10,
      textTransform: 'capitalize',
    },
    gridDot: {
      width: 3, height: 3, borderRadius: 1.5,
      backgroundColor: colors.textDisabled,
    },
    gridPlays: {
      ...typography.labelSmall, color: colors.textTertiary, fontSize: 10,
      textTransform: 'none',
    },
  }), [colors]);

  useEffect(() => {
    const delay = Math.min(index * 60, 400);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay,
        easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500, delay,
        easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, ...motion.snappy, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, ...motion.snappy, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[
        styles.gridCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
      ]}>
        {/* Gradient thumbnail */}
        <LinearGradient
          colors={cat.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gridThumb}
        >
          <Text style={styles.gridEmoji}>{cat.emoji}</Text>
          {/* Play overlay */}
          <View style={styles.gridPlayOverlay}>
            <Ionicons name="play" size={18} color="#FFF" />
          </View>
        </LinearGradient>

        {/* Info */}
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={1}>{game.title}</Text>
          <View style={styles.gridMetaRow}>
            <Text style={styles.gridCategory}>
              {(game.category || 'Game').charAt(0).toUpperCase() + (game.category || 'game').slice(1)}
            </Text>
            <View style={styles.gridDot} />
            <Text style={styles.gridPlays}>{(game.plays || 0).toLocaleString()}</Text>
            <Ionicons name="play" size={9} color={colors.textTertiary} style={{ marginLeft: 2 }} />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Continue Playing — horizontal scroll mini-cards
// ═══════════════════════════════════════════════════════════════════
const ContinueCard = memo(({ game, onPress }: { game: Game; onPress: () => void }) => {
  const { colors } = useTheme();
  const cat = getCategoryConfig(game.category);

  const styles = useMemo(() => StyleSheet.create({
    continueCard: { width: 110, alignItems: 'center' },
    continueThumb: {
      width: 110, height: 80, borderRadius: radii.lg,
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    continueTitle: {
      ...typography.bodySmall, color: colors.textPrimary,
      fontWeight: '600', textAlign: 'center',
    },
    continueMeta: {
      ...typography.labelSmall, color: colors.accentBright, fontSize: 9, marginTop: 2,
    },
  }), [colors]);
  return (
    <TouchableOpacity style={styles.continueCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={cat.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.continueThumb}
      >
        <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
      </LinearGradient>
      <Text style={styles.continueTitle} numberOfLines={1}>{game.title}</Text>
      <Text style={styles.continueMeta}>Tap to resume</Text>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Category Chip — premium pill with gradient fill when selected
// ═══════════════════════════════════════════════════════════════════
const CategoryChip = memo(({ category, isSelected, onPress }: {
  category: typeof CATEGORIES[0]; isSelected: boolean; onPress: () => void;
}) => {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    chipButton: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: radii.full, borderWidth: 1, borderColor: colors.borderDim,
      backgroundColor: colors.glassMedium, overflow: 'hidden',
    },
    chipSelected: { borderColor: 'transparent' },
    chipText: { ...typography.labelMedium, color: colors.textTertiary, fontSize: 13 },
    chipTextSelected: { color: '#FFF', fontWeight: '700' },
  }), [colors]);

  return (
    <TouchableOpacity
      style={[styles.chipButton, isSelected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected ? (
        <LinearGradient
          colors={category.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.full }]}
        />
      ) : null}
      <Text style={{ fontSize: 13 }}>{category.emoji}</Text>
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════════
// MAIN LIBRARY SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function LibraryScreen({ onSelectCategory, onLaunchGame }: LibraryProps) {
  const { themeId, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const searchScale = useRef(new Animated.Value(1)).current;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.void },
    safeArea: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 120 },
    header: { marginBottom: spacing.md },
    headerRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    },
    headerTitle: {
      ...typography.displayMedium, color: colors.textPrimary, fontWeight: '900',
    },
    headerSubtitle: {
      ...typography.bodyMedium, color: colors.textTertiary, marginTop: 2,
    },
    headerCountBadge: {
      alignItems: 'center',
      backgroundColor: colors.accentPulse,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.accentGlow,
    },
    headerCountText: {
      ...typography.headlineMedium, color: colors.accent, fontWeight: '900',
    },
    headerCountLabel: {
      ...typography.labelSmall, color: colors.textTertiary, fontSize: 8,
    },
    searchContainer: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: radii.xl, paddingHorizontal: spacing.md, height: 52,
      borderWidth: 1, marginBottom: spacing.md, ...shadows.sm,
    },
    searchInput: {
      flex: 1, marginLeft: spacing.sm, color: colors.textPrimary,
      ...typography.bodyLarge, fontSize: 15,
    },
    chipScroll: { marginBottom: spacing.md },
    chipRow: { gap: spacing.sm, paddingRight: spacing.md },
    section: { marginTop: spacing.lg },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: spacing.md,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: {
      ...typography.headlineSmall, color: colors.textPrimary, fontWeight: '800',
    },
    sectionCount: {
      ...typography.labelSmall, color: colors.accent,
      backgroundColor: colors.accentPulse, paddingHorizontal: 10,
      paddingVertical: 4, borderRadius: radii.full,
      borderWidth: 1, borderColor: colors.accentGlow, overflow: 'hidden',
    },
    continueRow: { gap: 12, paddingRight: spacing.lg },
    gridRow: { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },
    emptyState: {
      alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm,
    },
    emptyIconWrap: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.glassMedium, alignItems: 'center',
      justifyContent: 'center', marginBottom: spacing.sm,
    },
    emptyTitle: {
      ...typography.headlineSmall, color: colors.textSecondary, fontWeight: '700',
    },
    emptySubtitle: { ...typography.bodyMedium, color: colors.textTertiary },
  }), [colors]);

  useEffect(() => {
    const easing = Easing.bezier(...motion.easing.smooth as [number, number, number, number]);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing, useNativeDriver: true }),
    ]).start();
    loadData();
  }, []);

  const loadData = async () => {
    const [games, recentIds] = await Promise.all([
      api.getFeed(),
      userService.getRecentGames(),
    ]);
    setAllGames(games);
    const recent = recentIds
      .map(id => games.find(g => g.id === id))
      .filter(Boolean) as Game[];
    setRecentGames(recent);
  };

  const filteredGames = useMemo(() => {
    let result = allGames;
    if (selectedCategory !== 'all') {
      result = result.filter(g => g.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q) ||
        g.creator?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allGames, selectedCategory, searchQuery]);

  // Pick a featured game (most plays)
  const featuredGame = useMemo(() => {
    if (filteredGames.length === 0) return null;
    return [...filteredGames].sort((a, b) => (b.plays || 0) - (a.plays || 0))[0];
  }, [filteredGames]);

  // Grid games exclude the featured game
  const gridGames = useMemo(() => {
    if (!featuredGame) return filteredGames;
    return filteredGames.filter(g => g.id !== featuredGame.id);
  }, [filteredGames, featuredGame]);

  const onSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.spring(searchScale, { toValue: 1.02, ...motion.snappy, useNativeDriver: true }).start();
  };
  const onSearchBlur = () => {
    setIsSearchFocused(false);
    Animated.spring(searchScale, { toValue: 1, ...motion.snappy, useNativeDriver: true }).start();
  };

  const handleCategoryPress = (id: string) => {
    setSelectedCategory(id);
    onSelectCategory(id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Build grid rows (2-per-row)
  const gridRows = useMemo(() => {
    const rows: Game[][] = [];
    for (let i = 0; i < gridGames.length; i += 2) {
      rows.push(gridGames.slice(i, i + 2));
    }
    return rows;
  }, [gridGames]);

  return (
    <View style={[styles.container, { backgroundColor: colors.void }]}>
      <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />
      {/* Decorative mesh blobs — fixed behind scroll */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: colors.accent, opacity: 0.06, transform: [{ scale: 1.5 }] }} />
        <View style={{ position: 'absolute', bottom: 100, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.pink, opacity: 0.04, transform: [{ scale: 1.3 }] }} />
        <View style={{ position: 'absolute', top: '40%', right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.accentBright, opacity: 0.03 }} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ─── Header ─── */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Library</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {allGames.length} experiences
                  </Text>
                </View>
                <View style={styles.headerCountBadge}>
                  <Text style={[styles.headerCountText, { color: colors.textPrimary }]}>{filteredGames.length}</Text>
                  <Text style={[styles.headerCountLabel, { color: colors.textTertiary }]}>showing</Text>
                </View>
              </View>
            </View>

            {/* ─── Search Bar (glassmorphism) ─── */}
            <Animated.View style={[
              styles.searchContainer,
              {
                transform: [{ scale: searchScale }],
                borderColor: isSearchFocused ? colors.accentBright : colors.borderDim,
                backgroundColor: isSearchFocused ? 'rgba(99, 102, 241, 0.08)' : colors.glassMedium,
              }
            ]}>
              <Ionicons name="search" size={20}
                color={isSearchFocused ? colors.accentBright : colors.textTertiary} />
              <TextInput
                placeholder="Search games, genres, creators..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* ─── Category Chips ─── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
              {CATEGORIES.map(cat => (
                <CategoryChip
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategory === cat.id}
                  onPress={() => handleCategoryPress(cat.id)}
                />
              ))}
            </ScrollView>

            {/* ─── Continue Playing ─── */}
            {recentGames.length > 0 && !searchQuery && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="time" size={16} color={colors.accentBright} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Continue Playing</Text>
                  </View>
                  <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{recentGames.length}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.continueRow}>
                  {recentGames.slice(0, 8).map(game => (
                    <ContinueCard
                      key={game.id}
                      game={game}
                      onPress={() => onLaunchGame(game.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ─── Featured Game ─── */}
            {featuredGame && !searchQuery && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Pick</Text>
                  </View>
                </View>
                <FeaturedCard game={featuredGame} onPress={() => onLaunchGame(featuredGame.id)} />
              </View>
            )}

            {/* ─── Game Grid ─── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="grid" size={16} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    {searchQuery ? `Results for "${searchQuery}"` :
                      selectedCategory !== 'all'
                        ? CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Games'
                        : 'All Games'}
                  </Text>
                </View>
                <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{gridGames.length}</Text>
              </View>

              {gridGames.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="search-outline" size={32} color={colors.textDisabled} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No games found</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>Try a different search or category</Text>
                </View>
              ) : (
                gridRows.map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.gridRow}>
                    {row.map((game, colIdx) => (
                      <GameGridCard
                        key={game.id}
                        game={game}
                        index={rowIdx * 2 + colIdx}
                        onPress={() => onLaunchGame(game.id)}
                      />
                    ))}
                    {/* Spacer when odd count */}
                    {row.length === 1 && <View style={{ width: CARD_W }} />}
                  </View>
                ))
              )}
            </View>

          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
