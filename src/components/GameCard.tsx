import React, { useRef, memo, useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Animated, ActivityIndicator, Platform, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Game } from '../types';
import { typography, spacing, radii } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { SkeletonShimmer } from './SkeletonShimmer';
import { useThermalState } from '../hooks/useThermalState';
import { useGameBridge } from '../hooks/useGameBridge';
import { gameProgressService } from '../services/gameProgressService';
import { getStatsUrl } from '../config/environment';
import { shareService } from '../services/shareService';
import { getCategoryGradient, getCategoryEmoji } from '../constants/categories';

const MeshBackground = () => {
    const { colors } = useTheme();
    const styles = useMemo(() => StyleSheet.create({
        meshGradient: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
    }), [colors]);
    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={[colors.void, colors.obsidian]}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.meshGradient, { backgroundColor: colors.accent, opacity: 0.05, top: -100, left: -100, transform: [{ scale: 2 }] }]} />
        </View>
    );
};

interface Props {
    game: Game;
    isActive: boolean;
    isPreload: boolean;
    isPlaying?: boolean;
    onGameEvent?: (event: string, data: unknown) => void;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
}

function LoadingState({ title }: { title: string }) {
    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const styles = useMemo(() => StyleSheet.create({
        loadingContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.void, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
        skeletonWrapper: { flex: 1, width: '100%' },
        skeletonContent: { padding: spacing.xl },
        skeletonStats: { flexDirection: 'row', gap: spacing.md },
        loadingOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
        loadingTitle: { ...typography.displaySmall, color: colors.textPrimary, marginTop: spacing.md, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
    }), [colors]);

    return (
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
            <LinearGradient
                colors={[colors.obsidian, colors.void]}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.skeletonWrapper}>
                <SkeletonShimmer height={'40%' as any} borderRadius={0} style={{ width: '100%' }} />
                <View style={styles.skeletonContent}>
                    <SkeletonShimmer width="60%" height={32} borderRadius={radii.md} style={{ marginBottom: spacing.md }} />
                    <SkeletonShimmer width="90%" height={16} borderRadius={radii.sm} style={{ marginBottom: spacing.xs }} />
                    <SkeletonShimmer width="80%" height={16} borderRadius={radii.sm} style={{ marginBottom: spacing.xl }} />
                    <View style={styles.skeletonStats}>
                        <SkeletonShimmer width={80} height={40} borderRadius={radii.md} />
                        <SkeletonShimmer width={80} height={40} borderRadius={radii.md} />
                        <SkeletonShimmer width={80} height={40} borderRadius={radii.md} />
                    </View>
                </View>
            </View>
            <View style={styles.loadingOverlay}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={styles.loadingTitle}>{title.toUpperCase()}</Text>
            </View>
        </Animated.View>
    );
}

function ErrorState({ game }: { game: Game }) {
    const { colors } = useTheme();
    const category = (game.category || 'arcade').toLowerCase();
    const gradient = getCategoryGradient(category);
    const emoji = getCategoryEmoji(category);
    const pulseAnim = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const styles = useMemo(() => StyleSheet.create({
        errorContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.void, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
        errorSubtitle: { ...typography.bodyMedium, color: colors.textTertiary, marginTop: spacing.sm },
        categoryBadge: { alignSelf: 'flex-start', backgroundColor: colors.accentGlow, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.accent },
        categoryText: { ...typography.labelSmall, color: colors.accent, fontWeight: '700', fontSize: 10 },
        errorGameTitle: { ...typography.displaySmall, color: colors.textPrimary, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
        errorContent: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, zIndex: 2 },
        errorEmoji: { fontSize: 72, marginBottom: 8 },
        errorFooter: { position: 'absolute', bottom: 80, alignSelf: 'center', zIndex: 2 },
        errorCreator: { ...typography.bodyMedium, color: colors.textSecondary },
        decorOrb: { position: 'absolute', borderRadius: 200, width: 300, height: 300 },
        decorOrb1: { top: '-10%', left: '-15%' },
        decorOrb2: { bottom: '-5%', right: '-10%' },
    }), [colors]);

    return (
        <View style={styles.errorContainer}>
            <LinearGradient
                colors={[gradient[0], gradient[1], gradient[2]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.decorOrb, styles.decorOrb1, { opacity: pulseAnim, backgroundColor: gradient[0] }]} />
            <Animated.View style={[styles.decorOrb, styles.decorOrb2, { opacity: pulseAnim, backgroundColor: gradient[2] }]} />
            <View style={styles.errorContent}>
                <Text style={styles.errorEmoji}>{emoji}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: gradient[0] + '30', borderColor: gradient[0] + '60' }]}>
                    <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
                </View>
                <Text style={styles.errorGameTitle}>{game.title}</Text>
                <Text style={styles.errorSubtitle}>Tap to play when server is running</Text>
            </View>
            <View style={styles.errorFooter}>
                {game.creator && <Text style={styles.errorCreator}>by {game.creator}</Text>}
            </View>
        </View>
    );
}

const GameCard = memo(({ game, isActive, isPreload, isPlaying = false, onGameEvent, onInteractionStart, onInteractionEnd }: Props) => {
    const { colors } = useTheme();
    const webViewRef = useRef<WebView>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    useThermalState();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.96)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const hudAnim = useRef(new Animated.Value(0)).current;
    const hudScale = useRef(new Animated.Value(0.8)).current;
    const [hudMessage, setHudMessage] = useState<string | null>(null);

    const [realStats, setRealStats] = useState({
        likes: game.likes ?? 0,
        playing: game.plays ?? 0,
        isLiked: false,
    });
    const likesCount = realStats.likes ?? 0;
    const playsCount = realStats.playing ?? game.plays ?? 0;

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, width: '100%', height: '100%', backgroundColor: colors.void, overflow: 'hidden' },
        webView: { flex: 1, backgroundColor: 'transparent' },
        webViewWrapper: { flex: 1 },
        webFrameWrapper: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
        hidden: { opacity: 0, position: 'absolute' },
        placeholder: { flex: 1, backgroundColor: colors.void },
        loadingContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.void, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
        skeletonWrapper: { flex: 1, width: '100%' },
        skeletonContent: { padding: spacing.xl },
        skeletonStats: { flexDirection: 'row', gap: spacing.md },
        loadingOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
        loadingTitle: { ...typography.displaySmall, color: colors.textPrimary, marginTop: spacing.md, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
        errorContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.void, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
        errorSubtitle: { ...typography.bodyMedium, color: colors.textTertiary, marginTop: spacing.sm },
        hudContainer: { position: 'absolute', top: 60, alignSelf: 'center', zIndex: 100 },
        hudBlur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
        hudText: { ...typography.labelSmall, color: colors.textPrimary, fontWeight: '700', letterSpacing: 0.5 },
        footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, zIndex: 5 },
        footerGradient: { ...StyleSheet.absoluteFillObject },
        footerContent: { flex: 1, justifyContent: 'flex-end', padding: spacing.md, paddingBottom: 70, flexDirection: 'row', alignItems: 'flex-end' },
        gameInfo: { flex: 1 },
        categoryBadge: { alignSelf: 'flex-start', backgroundColor: colors.accentGlow, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.accent },
        categoryText: { ...typography.labelSmall, color: colors.accent, fontWeight: '700', fontSize: 10 },
        title: { ...typography.displaySmall, color: colors.textPrimary, fontWeight: '900', letterSpacing: 0.5 },
        creator: { ...typography.bodyMedium, color: colors.textSecondary, marginTop: 2 },
        statsContainer: { alignItems: 'flex-end', gap: spacing.sm },
        statItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
        statText: { ...typography.labelSmall, color: colors.textPrimary, fontWeight: '600' },
        rightActionBar: { position: 'absolute', right: 8, bottom: 160, zIndex: 20, alignItems: 'center', gap: 24 },
        actionButton: { alignItems: 'center', gap: 6 },
        actionIconShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
        actionLabel: { ...typography.labelSmall, color: '#FFF', fontWeight: '600', fontSize: 12, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
        avatarContainer: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
        followBadge: { position: 'absolute', bottom: -6, backgroundColor: colors.accent, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
        musicDiscContainer: { marginTop: 16 },
        musicDisc: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: '#111', backgroundColor: '#222' },
        meshGradient: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
        decorOrb: { position: 'absolute', borderRadius: 200, width: 300, height: 300 },
        decorOrb1: { top: '-10%', left: '-15%' },
        decorOrb2: { bottom: '-5%', right: '-10%' },
        errorContent: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, zIndex: 2 },
        errorEmoji: { fontSize: 72, marginBottom: 8 },
        errorGameTitle: { ...typography.displaySmall, color: colors.textPrimary, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
        errorFooter: { position: 'absolute', bottom: 80, alignSelf: 'center', zIndex: 2 },
        errorCreator: { ...typography.bodyMedium, color: colors.textSecondary },
    }), [colors]);

    const showHUD = useCallback((message: string) => {
        setHudMessage(message);
        Animated.parallel([
            Animated.timing(hudAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(hudScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start(() => {
            setTimeout(() => {
                Animated.timing(hudAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
            }, 2000);
        });
    }, [hudAnim, hudScale]);

    const bridge = useGameBridge({
        gameId: game.id,
        gameTitle: game.title,
        gameConfig: game.config,
        isActive,
        isPreload,
        webViewRef,
        onGameEvent,
        onInteractionStart,
        onInteractionEnd,
        onLoadingChange: setIsLoading,
        onErrorChange: setHasError,
        showHUD,
    });

    // ── Stats ────────────────────────────────────────────────────────────
    const fetchStats = async () => {
        try {
            const userId = await gameProgressService.getUserId();
            const statsUrl = getStatsUrl(game.id);
            const res = await fetch(`${statsUrl}?user_uuid=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setRealStats(prev => ({ ...prev, ...data }));
            }
        } catch {}
    };

    useEffect(() => {
        if (isActive) {
            fetchStats();
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [isActive]);

    const toggleLike = async () => {
        const newLiked = !realStats.isLiked;
        setRealStats(prev => ({
            ...prev,
            isLiked: newLiked,
            likes: newLiked ? prev.likes + 1 : prev.likes - 1,
        }));
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const userId = await gameProgressService.getUserId();
            const statsUrl = getStatsUrl(game.id);
            const baseUrl = statsUrl.replace(`/api/v1/games/${game.id}/stats`, '');
            const endpoint = newLiked ? 'like' : 'unlike';
            await fetch(`${baseUrl}/api/v1/games/${game.id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_uuid: userId }),
            });
        } catch {
            setRealStats(prev => ({
                ...prev,
                isLiked: !newLiked,
                likes: newLiked ? prev.likes - 1 : prev.likes + 1,
            }));
        }
    };

    // ── Active-state animations ──────────────────────────────────────────
    useEffect(() => {
        if (isActive) {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, damping: 25, stiffness: 120, useNativeDriver: true }),
            ]).start();
        } else {
            fadeAnim.setValue(0.7);
            scaleAnim.setValue(0.96);
            slideAnim.setValue(30);
        }
    }, [isActive]);

    if (!isActive && !isPreload) return <View style={styles.placeholder} />;

    const handleLoadEnd = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    // ── Web platform ─────────────────────────────────────────────────────
    if (Platform.OS === 'web') {
        return (
            <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
                <MeshBackground />
                {isLoading && <LoadingState title={game.title} />}
                {hasError && <ErrorState game={game} />}
                {!hasError && (
                    <View style={styles.webFrameWrapper} {...({ 'data-game-wrapper-id': game.id } as any)}>
                        <iframe
                            data-game-id={game.id}
                            src={game.game_url}
                            style={{
                                width: '100%', height: '100%', border: 'none',
                                backgroundColor: '#0a0a0f', opacity: isLoading ? 0 : 1,
                                position: 'absolute', top: 0, left: 0, zIndex: 1,
                            }}
                            onLoad={handleLoadEnd}
                            onError={handleError}
                        />
                    </View>
                )}
                {!isPlaying && (
                    <View style={styles.footer} pointerEvents="none">
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.footerGradient} />
                        <View style={styles.footerContent}>
                            <View style={styles.gameInfo}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{game.category?.toUpperCase() || 'EXPERIENCE'}</Text>
                                </View>
                                <Text style={styles.title}>{game.title}</Text>
                                {game.creator ? <Text style={styles.creator}>by {game.creator}</Text> : null}
                            </View>
                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Ionicons name="heart" size={18} color={colors.accent} />
                                    <Text style={styles.statText}>{likesCount.toLocaleString()}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="play" size={18} color={colors.textPrimary} />
                                    <Text style={styles.statText}>{playsCount.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </Animated.View>
        );
    }

    // ── Native platform ──────────────────────────────────────────────────
    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
            {isLoading && <LoadingState title={game.title} />}
            {hasError && <ErrorState game={game} />}

            {isPreload ? (
                <View
                    style={styles.webViewWrapper}
                    onStartShouldSetResponderCapture={() => false}
                >
                    <WebView
                        ref={webViewRef}
                        source={{ uri: game.game_url }}
                        style={[styles.webView, (isLoading || hasError) && styles.hidden]}
                        originWhitelist={['*']}
                        scrollEnabled={false}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        mediaPlaybackRequiresUserAction={false}
                        allowsInlineMediaPlayback={true}
                        renderToHardwareTextureAndroid={true}
                        androidLayerType="hardware"
                        startInLoadingState={false}
                        injectedJavaScript={`window.DURRA_CONFIG = ${JSON.stringify(game.config || {})}; true;`}
                        onLoadEnd={handleLoadEnd}
                        onError={handleError}
                        onMessage={bridge.handleNativeMessage}
                        onContentProcessDidTerminate={bridge.handleContentProcessDidTerminate}
                        {...((Platform.OS as string) === 'web' && { 'data-game-id': game.id })}
                    />
                </View>
            ) : (
                <View style={styles.placeholder} />
            )}

            {!isLoading && !hasError && !isPlaying && (
                <>
                    <View style={styles.rightActionBar} pointerEvents="box-none">
                        <View style={styles.actionButton}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person" size={24} color="#FFF" />
                                <View style={styles.followBadge}>
                                    <Ionicons name="add" size={12} color="#FFF" />
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={toggleLike}>
                            <Ionicons name={realStats.isLiked ? "heart" : "heart-outline"} size={32} color={realStats.isLiked ? colors.danger : "#FFF"} style={styles.actionIconShadow} />
                            <Text style={styles.actionLabel}>{realStats.likes?.toLocaleString()}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={() => shareService.shareGame(game.title, game.id)}>
                            <Ionicons name="share-social" size={30} color="#FFF" style={styles.actionIconShadow} />
                            <Text style={styles.actionLabel}>Share</Text>
                        </TouchableOpacity>
                        <View style={[styles.actionButton, styles.musicDiscContainer]}>
                            <LinearGradient colors={['#333', colors.obsidian]} style={styles.musicDisc}>
                                <Ionicons name="musical-notes" size={16} color="#FFF" />
                            </LinearGradient>
                        </View>
                    </View>

                    <View style={styles.footer} pointerEvents="none">
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']} style={styles.footerGradient} />
                        <View style={styles.footerContent}>
                            <View style={styles.gameInfo}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{game.category?.toUpperCase() || 'EXPERIENCE'}</Text>
                                </View>
                                <Text style={styles.title}>{game.title}</Text>
                                {game.creator ? <Text style={styles.creator}>by {game.creator}</Text> : null}
                            </View>
                        </View>
                    </View>
                </>
            )}

            <Animated.View style={[
                styles.hudContainer,
                {
                    opacity: hudAnim,
                    transform: [{ translateY: hudAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: hudScale }],
                },
            ]}>
                <BlurView intensity={80} tint="dark" style={styles.hudBlur}>
                    <Ionicons name="flash" size={12} color={colors.accentBright} />
                    <Text style={styles.hudText}>{hudMessage}</Text>
                </BlurView>
            </Animated.View>
        </Animated.View>
    );
});

export default GameCard;
