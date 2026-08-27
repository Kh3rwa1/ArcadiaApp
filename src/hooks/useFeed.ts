import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ScreenOrientation from 'expo-screen-orientation';
import { api } from '../services/api';
import { userService } from '../services/userService';
import { Game } from '../types';

interface UseFeedProps {
    initialTab?: string;
}

const START_PLAYING_EVENTS = new Set([
    'FLOW_START',
    'START',
    'GAME_START',
    'LIFECYCLE_RESUME',
]);

const normalizeGameEvent = (event?: string): string => {
    const normalizedEvent = (event || '').toUpperCase();
    const eventAliases: Record<string, string> = {
        GAME_STARTED: 'GAME_START',
        FLOW_STARTED: 'FLOW_START',
        RESUME: 'LIFECYCLE_RESUME',
    };
    return eventAliases[normalizedEvent] || normalizedEvent;
};

export function useFeed({ initialTab = 'home' }: UseFeedProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentScore, setCurrentScore] = useState(0);
    const [percentile, setPercentile] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [likedGames, setLikedGames] = useState<Set<string>>(new Set());

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
    }, [selectedCategory, games]);

    const loadFeed = async () => {
        try {
            setIsLoading(true);
            const [feedData, uid] = await Promise.all([
                api.getFeed(),
                api.getUserId(),
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

    const handleCategorySelect = useCallback((categoryId: string) => {
        setSelectedCategory(categoryId);
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, []);

    const trackImpression = useCallback((game: Game) => {
        if (game && userId) {
            api.trackEvent({
                game_uuid: game.id,
                user_uuid: userId,
                event_type: 'impression',
            });
        }
    }, [userId]);

    const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index ?? 0;
            if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
                setIsPlaying(false);
                setShowResults(false);
                setCurrentScore(0);
                setPercentile(null);
                if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                const game = filteredGames[newIndex];
                if (game) trackImpression(game);
            }
        }
    }, [activeIndex, filteredGames, trackImpression]);

    const handleGameEvent = useCallback(async (action: string, payload: any) => {
        const gameId = filteredGames[activeIndex]?.id;
        if (!gameId) return;

        const normalizedAction = normalizeGameEvent(action);

        if (normalizedAction === 'GAME_FOCUS') {
            setIsPlaying(true);
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } else if (START_PLAYING_EVENTS.has(normalizedAction)) {
            setIsPlaying(true);
        } else if (action === 'SCORE' || action === 'SCORE_UPDATE' || action === 'STATE_UPDATE') {
            if (payload?.score !== undefined) {
                setCurrentScore(payload.score);
            }
            if (!isPlaying) setIsPlaying(true);
        } else if (action === 'GAME_OVER' || action === 'GAME_COMPLETE' || action === 'FLOW_COMPLETE' || action === 'GAME_LOST' || action === 'GAME_FAILED' || action === 'PLAYER_DIED') {
            setShowResults(true);
            setIsPlaying(false);
            const game = filteredGames[activeIndex];
            const score = payload?.score || currentScore || 0;
            const duration = payload?.duration_ms || 60000;
            await userService.trackGameSession(gameId, duration, score, game?.category || undefined);
            if (userId) {
                const response = await api.trackEvent({
                    game_uuid: gameId,
                    user_uuid: userId,
                    event_type: 'flow_complete',
                    metadata: payload,
                });
                if (response?.percentile !== undefined) {
                    setPercentile(response.percentile);
                }
            }
        } else if (action === 'GAME_EXIT') {
            setIsPlaying(false);
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } else if (normalizedAction === 'ERROR_REPORT') {
            console.warn(`[Bridge Error] ${payload?.message}`);
        }
    }, [activeIndex, filteredGames, userId, isPlaying, currentScore]);

    const handleToggleLike = useCallback((gameId: string) => {
        setLikedGames(prev => {
            const next = new Set(prev);
            if (next.has(gameId)) {
                next.delete(gameId);
            } else {
                next.add(gameId);
            }
            return next;
        });
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, []);

    const handleRestart = useCallback(() => {
        setShowResults(false);
        setPercentile(null);
        setCurrentScore(0);
        setIsPlaying(true);
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, []);

    const handleNextGame = useCallback(() => {
        if (activeIndex < filteredGames.length - 1) {
            setActiveIndex(activeIndex + 1);
        }
        setShowResults(false);
        setPercentile(null);
        setCurrentScore(0);
    }, [activeIndex, filteredGames.length]);

    return {
        games,
        filteredGames,
        activeIndex,
        setActiveIndex,
        isLoading,
        userId,
        selectedCategory,
        setSelectedCategory,
        loadFeed,
        handleGameEvent,
        handleToggleLike,
        currentScore,
        percentile,
        showResults,
        setShowResults,
        isPlaying,
        setIsPlaying,
        handleRestart,
        handleNextGame,
        filteredGamesCount: filteredGames.length,
        likedGames,
        handleCategorySelect,
        handleViewableItemsChanged,
    };
}
