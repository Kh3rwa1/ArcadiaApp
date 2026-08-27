import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    StatusBar,
    Animated,
    Text,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GameCard from '../components/GameCard';
import CategorySelector from '../components/CategorySelector';
import MiniGameHeader from './MiniGameHeader';
import { useFeed } from '../hooks/useFeed';
import { useWindowDimensions } from '../hooks/useDimensions';
import { Game } from '../types';
import { typography, spacing, radii, motion, touchTargets } from '../theme';
import { useTheme } from '../context/ThemeContext';
import DiscoverScreen from './DiscoverScreen';
import LibraryScreen from './LibraryScreen';
import ProfileScreen from './ProfileScreen';
import AdminScreen from './AdminScreen';
import SettingsScreen from './SettingsScreen';
import NotificationsScreen from './NotificationsScreen';
import PremiumScreen from './PremiumScreen';

const NAV_TABS = [
    { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
    { id: 'library', icon: 'grid-outline', activeIcon: 'grid', label: 'Library' },
    { id: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
];

interface GameFeedProps {
    initialTab?: string;
}

export default function GameFeedScreen({ initialTab = 'home' }: GameFeedProps) {
    const { themeId, isLight, colors } = useTheme();
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const {
        games, filteredGames, activeIndex, setActiveIndex, isLoading,
        selectedCategory, handleCategorySelect, loadFeed,
        handleGameEvent, currentScore, percentile, showResults,
        setShowResults, isPlaying, setIsPlaying, handleRestart, handleNextGame,
        handleViewableItemsChanged,
    } = useFeed({ initialTab });

    // ── Animation refs ──────────────────────────────────────────────────
    const flatListRef = useRef<FlatList>(null);
    const scoreScale = useRef(new Animated.Value(1)).current;
    const navbarTranslateY = useRef(new Animated.Value(0)).current;
    const navbarOpacity = useRef(new Animated.Value(1)).current;
    const navbarPillX = useRef(new Animated.Value(0)).current;
    const resultsOpacity = useRef(new Animated.Value(0)).current;
    const resultsScale = useRef(new Animated.Value(0.9)).current;
    const discoverAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const tabWidth = useMemo(() => (SCREEN_WIDTH - spacing.md * 2) / NAV_TABS.length, [SCREEN_WIDTH]);
    const tabScales = useRef(NAV_TABS.map(() => new Animated.Value(1))).current;
    const [activeTab, setActiveTab] = React.useState(initialTab);
    const [pendingGameIndex, setPendingGameIndex] = React.useState<number | null>(null);
    const [showDiscover, setShowDiscover] = React.useState(false);

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.void },
        cardWrapper: { position: 'relative', overflow: 'hidden' },
        scoreContainer: { position: 'absolute', top: 60, alignSelf: 'center', borderRadius: radii.full, overflow: 'hidden' },
        scoreBlur: {
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
            paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
            borderRadius: radii.full, borderWidth: 1, borderColor: colors.borderBright, backgroundColor: colors.glassMedium,
        },
        scoreValue: { ...typography.headlineLarge, color: colors.textPrimary, fontWeight: '800', letterSpacing: 1 },
        resultsOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 140, zIndex: 200 },
        resultsContent: { alignItems: 'center', gap: spacing.lg },
        resultsLabel: { ...typography.labelLarge, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2 },
        resultScore: { fontSize: 72, fontWeight: '900', color: colors.textPrimary, letterSpacing: -2 },
        percentileBadge: { backgroundColor: colors.accentGlow, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full, borderWidth: 1, borderColor: colors.accent },
        percentileText: { ...typography.labelLarge, color: colors.accent, fontWeight: '700', letterSpacing: 1 },
        resultActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
        primaryButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.textPrimary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.full },
        primaryButtonText: { ...typography.labelLarge, color: colors.void, fontWeight: '700' },
        secondaryButton: {
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
            backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md, borderRadius: radii.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        },
        secondaryButtonText: { ...typography.labelLarge, color: colors.textPrimary, fontWeight: '600' },
        loadingText: { ...typography.labelLarge, color: colors.textSecondary },
        discoverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.void, zIndex: 1000, paddingTop: 40 },
        discoverHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
        discoverTitle: { ...typography.headlineMedium, color: colors.textPrimary, fontWeight: '900' },
        closeDiscover: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: radii.full },
        navbar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
        navbarBlur: { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
        navbarContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
        navbarPill: { position: 'absolute', height: 44, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radii.lg, left: 6, zIndex: 0 },
        navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: touchTargets.minimum, height: '100%', zIndex: 1, gap: 2 },
        navLabel: { ...typography.labelSmall, color: colors.textTertiary, fontSize: 10 },
        meshGradient: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
        loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
        emptyFeed: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
        emptyText: { ...typography.headlineMedium, color: colors.textSecondary },
        loadingPulse: { width: 80, height: 2, backgroundColor: colors.accent, borderRadius: radii.full, marginBottom: spacing.md },
    }), [colors]);

    // ── Init pill position ──────────────────────────────────────────────
    useEffect(() => {
        const idx = Math.max(0, NAV_TABS.findIndex(t => t.id === initialTab));
        navbarPillX.setValue(idx * tabWidth);
    }, []);

    // ── Navbar show/hide ────────────────────────────────────────────────
    useEffect(() => {
        Animated.parallel([
            Animated.spring(navbarTranslateY, {
                toValue: isPlaying ? 120 : 0,
                ...motion.gesture,
                useNativeDriver: true,
            }),
            Animated.timing(navbarOpacity, {
                toValue: isPlaying ? 0 : 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isPlaying]);

    // ── Web scroll lock ─────────────────────────────────────────────────
    useEffect(() => {
        if (Platform.OS !== 'web' || !isPlaying) return;
        const html = document.documentElement;
        const body = document.body;
        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        body.style.overscrollBehavior = 'none';
        body.style.touchAction = 'none';
        return () => {
            html.style.overflow = '';
            body.style.overflow = '';
            body.style.overscrollBehavior = '';
            body.style.touchAction = '';
        };
    }, [isPlaying]);

    // ── Pending scroll on return to feed ────────────────────────────────
    useEffect(() => {
        if (activeTab === 'home' && pendingGameIndex !== null && flatListRef.current) {
            const idx = pendingGameIndex;
            setPendingGameIndex(null);
            setTimeout(() => flatListRef.current?.scrollToIndex({ index: idx, animated: false }), 100);
        }
    }, [activeTab, pendingGameIndex]);

    // ── Discover overlay slide ──────────────────────────────────────────
    useEffect(() => {
        Animated.spring(discoverAnim, {
            toValue: showDiscover ? 0 : SCREEN_HEIGHT,
            damping: 25,
            stiffness: 200,
            useNativeDriver: true,
        }).start();
    }, [showDiscover]);

    // ── Results overlay ─────────────────────────────────────────────────
    useEffect(() => {
        if (showResults) {
            setIsPlaying(false);
            Animated.parallel([
                Animated.spring(resultsOpacity, { toValue: 1, damping: 20, stiffness: 200, useNativeDriver: true }),
                Animated.spring(resultsScale, { toValue: 1, damping: 15, stiffness: 150, useNativeDriver: true }),
            ]).start();
        } else {
            resultsOpacity.setValue(0);
            resultsScale.setValue(0.9);
        }
    }, [showResults]);

    // ── Score pop animation (triggered by handleGameEvent) ──────────────
    useEffect(() => {
        if (currentScore > 0) {
            scoreScale.setValue(1.1);
            Animated.spring(scoreScale, { toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true }).start();
        }
    }, [currentScore]);

    // ── Web wheel/touchmove blocker ─────────────────────────────────────
    useEffect(() => {
        if (Platform.OS !== 'web' || !isPlaying) return;
        const block = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
        document.addEventListener('wheel', block, { passive: false });
        document.addEventListener('touchmove', block, { passive: false });
        return () => {
            document.removeEventListener('wheel', block);
            document.removeEventListener('touchmove', block);
        };
    }, [isPlaying]);

    // ── Handlers ────────────────────────────────────────────────────────
    const handleTabPress = useCallback((tabId: string) => {
        const idx = NAV_TABS.findIndex(t => t.id === tabId);
        setActiveTab(tabId);
        Animated.spring(navbarPillX, { toValue: idx * tabWidth, damping: 20, stiffness: 200, useNativeDriver: true }).start();
        Animated.sequence([
            Animated.spring(tabScales[idx], { toValue: 1.2, damping: 12, stiffness: 200, useNativeDriver: true }),
            Animated.spring(tabScales[idx], { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
        ]).start();
    }, [tabWidth]);

    const launchGame = useCallback((gameId: string) => {
        let idx = games.findIndex(g => g.id === gameId);
        if (idx === -1) {
            idx = games.findIndex(g =>
                g.id === gameId ||
                g.title.toLowerCase().replace(/\s+/g, '-') === gameId.toLowerCase() ||
                g.title.toLowerCase().replace(/\s+/g, '-') === gameId.toLowerCase().replace(/-v\d+$/i, '') ||
                (g as any).slug === gameId
            );
        }
        if (idx !== -1) {
            handleCategorySelect('all');
            setPendingGameIndex(idx);
            setActiveTab('home');
            setActiveIndex(idx);
        }
    }, [games, handleCategorySelect, setActiveIndex]);

    const navigateToCategory = useCallback((categoryId: string) => {
        handleCategorySelect(categoryId);
        setActiveTab('home');
    }, [handleCategorySelect]);

    const handleEndReached = useCallback(() => {
        if (filteredGames.length > 1) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: 0, animated: false });
                setActiveIndex(0);
            }, 100);
        }
    }, [filteredGames.length, setActiveIndex]);

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;

    // ── Render helpers ──────────────────────────────────────────────────
    const renderItem = useCallback(({ item, index }: { item: Game; index: number }) => {
        const isActive = index === activeIndex;
        return (
            <View style={[styles.cardWrapper, { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }]}>
                <GameCard game={item} isActive={isActive} isPreload={Math.abs(index - activeIndex) <= 1}
                    isPlaying={isActive && isPlaying} onGameEvent={handleGameEvent}
                    onInteractionStart={() => isActive && setIsPlaying(true)} />
                {isActive && currentScore > 0 && !showResults && (
                    <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreScale }] }]}>
                        <BlurView intensity={45} tint="dark" style={styles.scoreBlur}>
                            <Ionicons name="trophy" size={16} color={colors.gold} />
                            <Text style={styles.scoreValue}>{currentScore.toLocaleString()}</Text>
                        </BlurView>
                    </Animated.View>
                )}
                {showResults && isActive && (
                    <Animated.View style={[styles.resultsOverlay, { opacity: resultsOpacity, transform: [{ scale: resultsScale }] }]}>
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
                        <View style={styles.resultsContent}>
                            <Text style={styles.resultsLabel}>Run complete</Text>
                            <Text style={styles.resultScore}>{currentScore.toLocaleString()}</Text>
                            {percentile !== null && (
                                <View style={styles.percentileBadge}>
                                    <Text style={styles.percentileText}>TOP {percentile}%</Text>
                                </View>
                            )}
                            <View style={styles.resultActions}>
                                <TouchableOpacity style={styles.primaryButton} onPress={handleRestart} activeOpacity={0.8}>
                                    <Ionicons name="refresh" size={20} color={colors.void} />
                                    <Text style={styles.primaryButtonText}>Again</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryButton} onPress={handleNextGame} activeOpacity={0.8}>
                                    <Ionicons name="chevron-down" size={20} color={colors.textPrimary} />
                                    <Text style={styles.secondaryButtonText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                )}
            </View>
        );
    }, [activeIndex, isPlaying, showResults, currentScore, percentile, resultsOpacity, resultsScale, scoreScale, handleGameEvent, handleRestart, handleNextGame, setIsPlaying, SCREEN_HEIGHT, SCREEN_WIDTH]);

    const MeshBackground = () => (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient colors={[colors.void, colors.obsidian]} style={StyleSheet.absoluteFill} />
            <Animated.View style={[styles.meshGradient, { backgroundColor: colors.accent, opacity: 0.05, top: -100, left: -100, transform: [{ scale: 2 }] }]} />
            <Animated.View style={[styles.meshGradient, { backgroundColor: colors.pink, opacity: 0.03, bottom: -100, right: -50, transform: [{ scale: 1.5 }] }]} />
        </View>
    );

    const renderFeed = () => (
        <View style={[styles.container, { backgroundColor: colors.void }]}>
            <MeshBackground />
            <MiniGameHeader onPressDiscover={() => setShowDiscover(true)} visible={!isPlaying} />
            {filteredGames.length === 0 && !isLoading ? (
                <View style={styles.emptyFeed}>
                    <Ionicons name="game-controller-outline" size={64} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No games found in this reality</Text>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => handleCategorySelect('all')}>
                        <Text style={styles.secondaryButtonText}>Show All Games</Text>
                    </TouchableOpacity>
                </View>
            ) : isLoading ? (
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingPulse} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Synchronizing with DURRA Core...</Text>
                </View>
            ) : (
                <Animated.FlatList
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    ref={flatListRef}
                    data={filteredGames}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    pagingEnabled
                    scrollEnabled={!isPlaying}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    snapToInterval={SCREEN_HEIGHT}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    onViewableItemsChanged={handleViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    initialNumToRender={2}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    updateCellsBatchingPeriod={50}
                    removeClippedSubviews={Platform.OS !== 'web'}
                    getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
                    extraData={SCREEN_HEIGHT}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.1}
                />
            )}
        </View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return renderFeed();
            case 'library': return <LibraryScreen onSelectCategory={navigateToCategory} onLaunchGame={launchGame} />;
            case 'profile': return (
                <ProfileScreen
                    onAdminPress={() => setActiveTab('admin')}
                    onSettingsPress={() => setActiveTab('settings')}
                    onNotificationsPress={() => setActiveTab('notifications')}
                    onPremiumPress={() => setActiveTab('premium')}
                />
            );
            case 'admin': return <AdminScreen onBack={() => setActiveTab('profile')} />;
            case 'settings': return <SettingsScreen onBack={() => setActiveTab('profile')} />;
            case 'notifications': return <NotificationsScreen onBack={() => setActiveTab('profile')} onLaunchGame={id => { launchGame(id); setActiveTab('home'); }} />;
            case 'premium': return <PremiumScreen onBack={() => setActiveTab('profile')} />;
            case 'discover': return <DiscoverScreen onLaunchGame={id => { launchGame(id); setActiveTab('home'); }} />;
            default: return renderFeed();
        }
    };

    // ── Main render ─────────────────────────────────────────────────────
    return (        <View style={[styles.container, { backgroundColor: colors.void }]}>
            <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} translucent backgroundColor="transparent" hidden={isPlaying} />
            {renderContent()}

            {/* Bottom Navbar */}
            <Animated.View
                style={[styles.navbar, { transform: [{ translateY: navbarTranslateY }], opacity: navbarOpacity }]}
                pointerEvents={isPlaying ? 'none' : 'auto'}
            >
                <BlurView intensity={80} tint="dark" style={[styles.navbarBlur, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                    <View style={styles.navbarContent}>
                        <Animated.View style={[styles.navbarPill, { width: tabWidth - 12, transform: [{ translateX: navbarPillX }] }]} />
                        {NAV_TABS.map((tab, idx) => (
                            <TouchableOpacity key={tab.id} style={styles.navItem} onPress={() => handleTabPress(tab.id)} activeOpacity={0.7}>
                                <Animated.View style={{ transform: [{ scale: tabScales[idx] }] }}>
                                    <Ionicons name={(activeTab === tab.id ? tab.activeIcon : tab.icon) as any} size={24} color={activeTab === tab.id ? colors.textPrimary : colors.textTertiary} />
                                </Animated.View>
                                <Text style={[styles.navLabel, { color: activeTab === tab.id ? colors.textPrimary : colors.textTertiary }]}>{tab.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </BlurView>
            </Animated.View>

            {/* Discover Overlay */}
            <Animated.View style={[styles.discoverOverlay, { transform: [{ translateY: discoverAnim }], backgroundColor: colors.void }]}>
                <View style={styles.discoverHeader}>
                    <Text style={[styles.discoverTitle, { color: colors.textPrimary }]}>Discover</Text>
                    <TouchableOpacity onPress={() => setShowDiscover(false)} style={styles.closeDiscover}>
                        <Ionicons name="close" size={28} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <DiscoverScreen onLaunchGame={id => { setShowDiscover(false); launchGame(id); }} />
            </Animated.View>
        </View>
    );
}
