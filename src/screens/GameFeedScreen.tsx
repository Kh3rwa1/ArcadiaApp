import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    StatusBar,
    Animated,
    Text,
    TouchableOpacity,
    Platform,
    ScrollView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import GameCard from '../components/GameCard';
import { api } from '../services/api';
import { userService } from '../services/userService';
import { useWindowDimensions, useIsSmallDevice } from '../hooks/useDimensions';
import { Game } from '../types';
import { colors, typography, spacing, radii, motion, touchTargets } from '../theme';
import { useThermalState, getRenderBatchSize } from '../hooks/useThermalState';
import DiscoverScreen from './DiscoverScreen';
import LibraryScreen from './LibraryScreen';
import ProfileScreen from './ProfileScreen';
import AdminScreen from './AdminScreen';

// Categories


// Navigation tabs
const NAV_TABS = [
    { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
    { id: 'library', icon: 'grid-outline', activeIcon: 'grid', label: 'Library' },
    { id: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
];

interface GameFeedProps {
    initialTab?: string;
}

export default function GameFeedScreen({ initialTab = 'home' }: GameFeedProps) {
    // Dynamic dimensions for responsive layout
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

    const [games, setGames] = useState<Game[]>([]);
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [userId, setUserId] = useState('');
    const [currentScore, setCurrentScore] = useState(0);
    const [percentile, setPercentile] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showDiscover, setShowDiscover] = useState(false);
    const [pendingGameIndex, setPendingGameIndex] = useState<number | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const scoreScale = useRef(new Animated.Value(1)).current;

    // Navbar animation
    const navbarTranslateY = useRef(new Animated.Value(0)).current;
    const navbarOpacity = useRef(new Animated.Value(1)).current;
    const navbarPillX = useRef(new Animated.Value(0)).current;

    // Memoize tabWidth to avoid recalculating on every render
    const tabWidth = useMemo(() => (SCREEN_WIDTH - spacing.md * 2) / NAV_TABS.length, [SCREEN_WIDTH]);
    const tabScales = useRef(NAV_TABS.map(() => new Animated.Value(1))).current;



    // Results animation
    const resultsOpacity = useRef(new Animated.Value(0)).current;
    const resultsScale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        const init = async () => {
            if (Platform.OS !== 'web') {
                try {
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
                } catch (e) {
                    console.warn('Orientation lock failed', e);
                }
            }
            await loadFeed();
        };
        init();
    }, []);

    // Animate navbar based on playing state
    useEffect(() => {
        if (isPlaying) {
            // Hide navbar when playing
            Animated.parallel([
                Animated.spring(navbarTranslateY, {
                    toValue: 120,
                    ...motion.gesture,
                    useNativeDriver: true,
                }),
                Animated.timing(navbarOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Show navbar when not playing
            Animated.parallel([
                Animated.spring(navbarTranslateY, {
                    toValue: 0,
                    ...motion.gesture,
                    useNativeDriver: true,
                }),
                Animated.timing(navbarOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isPlaying]);

    // Handle pending scrolls when returning to feed
    useEffect(() => {
        if (activeTab === 'home' && pendingGameIndex !== null && flatListRef.current) {
            const index = pendingGameIndex;
            setPendingGameIndex(null);
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index, animated: false });
            }, 100);
        }
    }, [activeTab, pendingGameIndex]);



    const discoverAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        Animated.spring(discoverAnim, {
            toValue: showDiscover ? 0 : SCREEN_HEIGHT,
            damping: 25,
            stiffness: 200,
            useNativeDriver: true,
        }).start();
    }, [showDiscover]);

    useEffect(() => {
        if (showResults) {
            setIsPlaying(false); // Show navbar when game ends
            Animated.parallel([
                Animated.spring(resultsOpacity, {
                    toValue: 1,
                    damping: 20,
                    stiffness: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(resultsScale, {
                    toValue: 1,
                    damping: 15,
                    stiffness: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            resultsOpacity.setValue(0);
            resultsScale.setValue(0.9);
        }
    }, [showResults]);

    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredGames(games);
        } else {
            const filtered = games.filter(g =>
                g.category?.toLowerCase() === selectedCategory.toLowerCase()
            );
            setFilteredGames(filtered.length > 0 ? filtered : games);
        }
        setActiveIndex(0);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [selectedCategory, games]);

    const loadFeed = async () => {
        try {
            setIsLoading(true);
            const [feedData, uid] = await Promise.all([
                api.getFeed(),
                api.getUserId()
            ]);
            setGames(feedData);
            setFilteredGames(feedData);
            setUserId(uid);
        } catch (error) {
            console.error('[Feed] Failed to load:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const toggleCategories = () => {
        // Toggle discover instead of simple categories if we want the "merged" experience
        setShowDiscover(!showDiscover);
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleTabPress = (tabId: string) => {
        const tabIndex = NAV_TABS.findIndex(t => t.id === tabId);
        setActiveTab(tabId);

        // Premium sliding pill animation
        Animated.spring(navbarPillX, {
            toValue: tabIndex * tabWidth,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
        }).start();

        // Premium tab scale animation
        Animated.sequence([
            Animated.spring(tabScales[tabIndex], { toValue: 1.2, damping: 12, stiffness: 200, useNativeDriver: true }),
            Animated.spring(tabScales[tabIndex], { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
        ]).start();

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 70,
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index ?? 0;
            if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
                setIsPlaying(false); // Reset playing state on swipe
                setIsPlaying(false); // Reset playing state on swipe
                if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }

                const game = filteredGames[newIndex];
                if (game && userId) {
                    api.trackEvent({
                        game_uuid: game.id,
                        user_uuid: userId,
                        event_type: 'impression',
                    });
                }
            }
        }
    }).current;

    const handleGameEvent = useCallback(async (action: string, payload: any) => {
        const gameId = filteredGames[activeIndex]?.id;
        if (!gameId) return;

        if (action === 'FLOW_START' || action === 'START' || action === 'GAME_START') {
            setIsPlaying(true); // Hide navbar when experience starts
        } else if (action === 'SCORE' || action === 'SCORE_UPDATE' || action === 'STATE_UPDATE') {
            if (payload?.score !== undefined) {
                setCurrentScore(payload.score);
            }
            if (!isPlaying) setIsPlaying(true);

            // Subtle interaction pop
            scoreScale.setValue(1.1);
            Animated.spring(scoreScale, {
                toValue: 1,
                damping: 10,
                stiffness: 200,
                useNativeDriver: true,
            }).start();
        } else if (action === 'GAME_OVER' || action === 'GAME_COMPLETE' || action === 'FLOW_COMPLETE') {
            setShowResults(true);
            setIsPlaying(false); // Show navbar when flow completes

            // Track game session for profile stats
            const game = filteredGames[activeIndex];
            const score = payload?.score || currentScore || 0;
            const duration = payload?.duration_ms || 60000; // Default 1 min if not provided
            await userService.trackGameSession(gameId, duration, score, game?.category || undefined);

            if (userId) {
                const response = await api.trackEvent({
                    game_uuid: gameId,
                    user_uuid: userId,
                    event_type: 'flow_complete',
                    metadata: payload
                });
                if (response?.percentile !== undefined) {
                    setPercentile(response.percentile);
                }
            }
        } else if (action === 'ERROR_REPORT') {
            console.warn(`[Bridge Error] ${payload?.message} `);
        }
    }, [activeIndex, filteredGames, userId, isPlaying]);

    const handleRestart = useCallback(() => {
        setShowResults(false);
        setPercentile(null);
        setCurrentScore(0);
        setIsPlaying(true); // Hide navbar on restart
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, []);

    const handleNextGame = useCallback(() => {
        if (activeIndex < filteredGames.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: activeIndex + 1,
                animated: true,
            });
        }
        setShowResults(false);
        setPercentile(null);
        setCurrentScore(0);
    }, [activeIndex, filteredGames.length]);

    // Infinite loop handler - when reaching end, scroll back to start
    const handleEndReached = useCallback(() => {
        if (filteredGames.length > 1) {
            // Small delay for smooth experience
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: 0,
                    animated: false, // Instant jump for seamless loop
                });
                setActiveIndex(0);
            }, 100);
        }
    }, [filteredGames.length]);

    const renderItem = useCallback(({ item, index }: { item: Game; index: number }) => {
        const isActive = index === activeIndex;
        const isPreload = Math.abs(index - activeIndex) <= 1;

        return (
            <View style={[styles.cardWrapper, { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }]}>
                <GameCard
                    game={item}
                    isActive={isActive}
                    isPreload={isPreload}
                    isPlaying={isActive && isPlaying}
                    onGameEvent={handleGameEvent}
                />

                {/* Score display when playing */}
                {isActive && currentScore > 0 && !showResults && (
                    <Animated.View style={[
                        styles.scoreContainer,
                        { transform: [{ scale: scoreScale }] }
                    ]}>
                        <Text style={styles.scoreValue}>{currentScore.toLocaleString()}</Text>
                    </Animated.View>
                )}

                {/* Results overlay */}
                {showResults && isActive && (
                    <Animated.View
                        style={[
                            styles.resultsOverlay,
                            {
                                opacity: resultsOpacity,
                                transform: [{ scale: resultsScale }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.85)']}
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.resultsContent}>
                            <Text style={styles.resultScore}>{currentScore.toLocaleString()}</Text>

                            {percentile !== null && (
                                <View style={styles.percentileBadge}>
                                    <Text style={styles.percentileText}>TOP {percentile}%</Text>
                                </View>
                            )}

                            <View style={styles.resultActions}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleRestart}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="refresh" size={20} color={colors.void} />
                                    <Text style={styles.primaryButtonText}>Again</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={handleNextGame}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="chevron-down" size={20} color={colors.textPrimary} />
                                    <Text style={styles.secondaryButtonText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                )}
            </View>
        );
    }, [activeIndex, filteredGames, userId, isPlaying, showResults, currentScore, percentile, resultsOpacity, resultsScale]);

    const MeshBackground = () => (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={[colors.void, colors.obsidian]}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.meshGradient, { backgroundColor: colors.accent, opacity: 0.05, top: -100, left: -100, transform: [{ scale: 2 }] }]} />
            <Animated.View style={[styles.meshGradient, { backgroundColor: colors.pink, opacity: 0.03, bottom: -100, right: -50, transform: [{ scale: 1.5 }] }]} />
        </View>
    );

    const renderFeed = () => (
        <View style={styles.container}>
            <MeshBackground />
            {/* Premium Discover Button */}
            {!isPlaying && (
                <TouchableOpacity
                    style={styles.categoryButton}
                    onPress={() => setShowDiscover(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="compass" size={24} color={colors.accent} />
                    <Text style={styles.discoverButtonText}>Discover</Text>
                </TouchableOpacity>
            )}


            {/* Game Feed */}
            {
                filteredGames.length === 0 && !isLoading ? (
                    <View style={styles.emptyFeed}>
                        <Ionicons name="game-controller-outline" size={64} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>No games found in this reality</Text>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => setSelectedCategory('all')}
                        >
                            <Text style={styles.secondaryButtonText}>Show All Games</Text>
                        </TouchableOpacity>
                    </View>
                ) : isLoading ? (
                    <View style={styles.loadingContainer}>
                        <View style={styles.loadingPulse} />
                        <Text style={styles.loadingText}>Synchronizing with Arcadia Core...</Text>
                    </View>
                ) : (
                    <Animated.FlatList
                        style={{ flex: 1 }}
                        contentContainerStyle={{ flexGrow: 1 }}
                        ref={flatListRef}
                        data={filteredGames}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        pagingEnabled
                        showsVerticalScrollIndicator={false}
                        snapToInterval={SCREEN_HEIGHT}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        initialNumToRender={2}
                        maxToRenderPerBatch={2}
                        windowSize={3}
                        updateCellsBatchingPeriod={50}
                        removeClippedSubviews={Platform.OS !== 'web'}
                        getItemLayout={(_, index) => (
                            { length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index }
                        )}
                        extraData={SCREEN_HEIGHT}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.1}
                    />
                )
            }
        </View >
    );

    const launchGame = (gameId: string) => {
        // Robust search: try ID first, then title-based slug
        let gameIndex = games.findIndex(g => g.id === gameId);

        if (gameIndex === -1) {
            gameIndex = games.findIndex(g =>
                g.id === gameId ||
                g.title.toLowerCase().replace(/\s+/g, '-') === gameId.toLowerCase() ||
                g.title.toLowerCase().replace(/\s+/g, '-') === gameId.toLowerCase().replace(/-v\d+$/i, '') ||
                (g as any).slug === gameId
            );
        }

        if (gameIndex !== -1) {
            setSelectedCategory('all');
            setPendingGameIndex(gameIndex);
            setActiveTab('home');
            setActiveIndex(gameIndex);
        }
    };

    const navigateToCategory = (categoryId: string) => {
        handleCategorySelect(categoryId);
        setActiveTab('home');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return renderFeed();
            case 'library': return <LibraryScreen onSelectCategory={navigateToCategory} onLaunchGame={launchGame} />;
            case 'profile': return <ProfileScreen onAdminPress={() => setActiveTab('admin')} />;
            case 'admin': return <AdminScreen onBack={() => setActiveTab('profile')} />;
            default: return renderFeed();
        }
    };



    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" hidden={isPlaying} />

            {renderContent()}

            {/* Bottom Navigation Bar - Auto-hide when playing */}
            <Animated.View
                style={[
                    styles.navbar,
                    {
                        transform: [{ translateY: navbarTranslateY }],
                        opacity: navbarOpacity,
                    }
                ]}
                pointerEvents={isPlaying ? 'none' : 'auto'}
            >
                <BlurView intensity={80} tint="dark" style={styles.navbarBlur}>
                    <View style={styles.navbarContent}>
                        <Animated.View
                            style={[
                                styles.navbarPill,
                                {
                                    width: tabWidth - 12,
                                    transform: [{ translateX: navbarPillX }]
                                }
                            ]}
                        />
                        {NAV_TABS.map((tab, idx) => (
                            <TouchableOpacity
                                key={tab.id}
                                style={styles.navItem}
                                onPress={() => handleTabPress(tab.id)}
                                activeOpacity={0.7}
                            >
                                <Animated.View style={{ transform: [{ scale: tabScales[idx] }] }}>
                                    <Ionicons
                                        name={(activeTab === tab.id ? tab.activeIcon : tab.icon) as any}
                                        size={24}
                                        color={activeTab === tab.id ? colors.textPrimary : colors.textTertiary}
                                    />
                                </Animated.View>
                                <Text style={[
                                    styles.navLabel,
                                    activeTab === tab.id && styles.navLabelActive
                                ]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </BlurView>
            </Animated.View>

            {/* Discover Overlay */}
            <Animated.View style={[
                styles.discoverOverlay,
                { transform: [{ translateY: discoverAnim }] }
            ]}>
                <View style={styles.discoverHeader}>
                    <Text style={styles.discoverTitle}>Discover</Text>
                    <TouchableOpacity
                        onPress={() => setShowDiscover(false)}
                        style={styles.closeDiscover}
                    >
                        <Ionicons name="close" size={28} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <DiscoverScreen onLaunchGame={(id) => {
                    setShowDiscover(false);
                    launchGame(id);
                }} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.void,
    },
    cardWrapper: {
        // Height and width set dynamically in renderItem
        position: 'relative',
        overflow: 'hidden',
    },
    categoryButton: {
        position: 'absolute',
        top: 50,
        left: spacing.lg,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    discoverButtonText: {
        ...typography.labelLarge,
        color: colors.textPrimary,
        fontWeight: '700',
    },

    scoreContainer: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    scoreValue: {
        ...typography.headlineLarge,
        color: colors.textPrimary,
        fontWeight: '800',
        letterSpacing: 1,
    },
    resultsOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 140,
        zIndex: 200,
    },
    resultsContent: {
        alignItems: 'center',
        gap: spacing.lg,
    },
    resultScore: {
        fontSize: 72,
        fontWeight: '900',
        color: colors.textPrimary,
        letterSpacing: -2,
    },
    percentileBadge: {
        backgroundColor: colors.accentGlow,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: colors.accent,
    },
    percentileText: {
        ...typography.labelLarge,
        color: colors.accent,
        fontWeight: '700',
        letterSpacing: 1,
    },
    resultActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.textPrimary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radii.full,
    },
    primaryButtonText: {
        ...typography.labelLarge,
        color: colors.void,
        fontWeight: '700',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    secondaryButtonText: {
        ...typography.labelLarge,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    loadingText: {
        ...typography.labelLarge,
        color: colors.textSecondary,
    },
    discoverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.void,
        zIndex: 1000,
        paddingTop: 40,
    },
    discoverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.lg,
    },
    discoverTitle: {
        ...typography.headlineMedium,
        color: colors.textPrimary,
        fontWeight: '900',
    },
    closeDiscover: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: radii.full,
    },
    navbar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    navbarBlur: {
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    navbarContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    navbarPill: {
        position: 'absolute',
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: radii.lg,
        left: 6,
        zIndex: 0,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: touchTargets.minimum, // Ensure 44pt touch target
        height: '100%',
        zIndex: 1,
        gap: 2,
    },
    navLabel: {
        ...typography.labelSmall,
        color: colors.textTertiary,
        fontSize: 10,
    },
    navLabelActive: {
        color: colors.textPrimary,
    },
    meshGradient: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.void,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },

    emptyFeed: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    emptyText: {
        ...typography.headlineMedium,
        color: colors.textSecondary,
    },
    loadingPulse: {
        width: 80,
        height: 2,
        backgroundColor: colors.accent,
        borderRadius: radii.full,
        marginBottom: spacing.md,
    }
});
