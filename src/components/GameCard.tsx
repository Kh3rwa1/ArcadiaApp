import React, { useRef, memo, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, ActivityIndicator, Platform, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Game, GameProgress } from '../types';
import { colors, typography, spacing, radii, shadows, touchTargets } from '../theme';
import { SkeletonShimmer } from './SkeletonShimmer';
import { useThermalState } from '../hooks/useThermalState';
import { gameProgressService } from '../services/gameProgressService';

const MeshBackground = () => (
    <View style={StyleSheet.absoluteFill}>
        <LinearGradient
            colors={[colors.void, colors.obsidian]}
            style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.meshGradient, { backgroundColor: colors.accent, opacity: 0.05, top: -100, left: -100, transform: [{ scale: 2 }] }]} />
    </View>
);


interface Props {
    game: Game;
    isActive: boolean;
    isPreload: boolean;
    isPlaying?: boolean;
    onGameEvent?: (event: string, data: unknown) => void;
}

// Premium Loading State Component
function LoadingState({ title }: { title: string }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

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

// Error State Component
function ErrorState() {
    return (
        <View style={styles.errorContainer}>
            <LinearGradient
                colors={[colors.dangerGlow, 'transparent']}
                style={styles.errorGlow}
            />
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorSubtitle}>Unable to load this experience</Text>
        </View>
    );
}

const GameCard = memo(({ game, isActive, isPreload, isPlaying = false, onGameEvent }: Props) => {
    const webViewRef = useRef<WebView>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Thermal state for adaptive quality
    const { qualityLevel, shouldDisableMeshGradients, shouldReduceAnimations } = useThermalState();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.96)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const hudAnim = useRef(new Animated.Value(0)).current;
    const hudScale = useRef(new Animated.Value(0.8)).current;
    const [hudMessage, setHudMessage] = useState<string | null>(null);

    // Real-time Stats Integration
    const [realStats, setRealStats] = useState({
        likes: game.likes || 1234,
        comments: 0,
        playing: 0,
        isLiked: false
    });

    useEffect(() => {
        if (isActive) {
            fetchStats();
            const interval = setInterval(fetchStats, 30000); // 30s Poll
            return () => clearInterval(interval);
        }
    }, [isActive]);

    const fetchStats = async () => {
        try {
            const userId = await gameProgressService.getUserId();
            const host = Platform.OS === 'web' ? 'http://localhost:8000' : 'http://192.168.0.101:8000';
            const res = await fetch(`${host}/api/v1/games/${game.id}/stats?user_uuid=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setRealStats(prev => ({ ...prev, ...data }));
            }
        } catch (e) {
            // connection error, keep default
        }
    };

    const toggleLike = async () => {
        const newLiked = !realStats.isLiked;
        setRealStats(prev => ({
            ...prev,
            isLiked: newLiked,
            likes: newLiked ? prev.likes + 1 : prev.likes - 1
        }));

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        try {
            const userId = await gameProgressService.getUserId();
            const host = Platform.OS === 'web' ? 'http://localhost:8000' : 'http://192.168.0.101:8000';
            const endpoint = newLiked ? 'like' : 'unlike';
            await fetch(`${host}/api/v1/games/${game.id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_uuid: userId })
            });
        } catch {
            // Revert on failure
            setRealStats(prev => ({
                ...prev,
                isLiked: !newLiked,
                likes: newLiked ? prev.likes - 1 : prev.likes + 1
            }));
        }
    };

    // Cleanup WebView on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (Platform.OS !== 'web' && webViewRef.current) {
                webViewRef.current.stopLoading();
                // Clear any injected state
                webViewRef.current.injectJavaScript('window.ARCADIA_CONFIG = null; true;');
            }
        };
    }, []);

    // Handle iOS WebView content process termination (memory pressure)
    const handleContentProcessDidTerminate = () => {
        console.warn(`[GameCard] ${game.title} WebView process terminated, reloading...`);
        setIsLoading(true);
        setHasError(false);
        webViewRef.current?.reload();
    };

    const showHUD = (message: string) => {
        setHudMessage(message);
        Animated.parallel([
            Animated.timing(hudAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(hudScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
        ]).start(() => {
            setTimeout(() => {
                Animated.timing(hudAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
            }, 2000);
        });
    };

    const sendMessage = (action: string, type: 'LIFECYCLE' | 'APP' | 'UX' = 'LIFECYCLE', payload?: any) => {
        const message = JSON.stringify({ version: '1.1', type, action, payload });
        if (Platform.OS === 'web') {
            const iframe = document.querySelector(`iframe[data-game-id="${game.id}"]`) as HTMLIFrameElement;
            iframe?.contentWindow?.postMessage(message, '*');
        } else {
            const script = `
                if(window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('ArcadiaBridge', { 
                        detail: ${message}
                    }));
                }
                true;
            `;
            webViewRef.current?.injectJavaScript(script);
        }
    };

    // Web Bridge Listener
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMessage = (event: any) => {
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (data?.action) {
                        onGameEvent?.(data.action, data.payload);
                    }
                } catch { }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }
    }, [onGameEvent]);

    useEffect(() => {
        if (isActive) {
            sendMessage('LIFECYCLE_RESUME');
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, damping: 25, stiffness: 120, useNativeDriver: true }),
            ]).start();
            console.log(`[GameCard] ${game.title} (Active)`);
        } else {
            sendMessage('LIFECYCLE_PAUSE');
            fadeAnim.setValue(0.7);
            scaleAnim.setValue(0.96);
            slideAnim.setValue(30);
        }
    }, [isActive]);

    // LIFECYCLE_STOP for games that are no longer in preload range (battery optimization)
    useEffect(() => {
        if (!isPreload && !isActive) {
            // Send hard STOP to completely halt game execution (timers, animations, audio)
            sendMessage('LIFECYCLE_STOP');
            console.log(`[GameCard] ${game.title} STOPPED (out of range)`);
        }
    }, [isPreload, isActive]);

    if (!isActive && !isPreload) {
        return <View style={styles.placeholder} />;
    }

    const handleLoadEnd = () => {
        console.log(`[GameCard] ${game.title} loaded (onLoadEnd)`);
        setIsLoading(false);
        setHasError(false);
    };

    const handleError = () => {
        console.warn(`[GameCard] ${game.title} failed to load`);
        setIsLoading(false);
        setHasError(true);
    };

    // Platform-specific rendering
    if (Platform.OS === 'web') {
        return (
            <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
                <MeshBackground />
                {isLoading && <LoadingState title={game.title} />}
                {hasError && <ErrorState />}
                <iframe
                    data-game-id={game.id}
                    src={game.game_url}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        opacity: isLoading || hasError ? 0 : 1,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                    }}
                    onLoad={handleLoadEnd}
                    onError={handleError}
                />

                {/* Information Overlay for Web */}
                {!isLoading && !hasError && (
                    <View style={styles.footer} pointerEvents="none">
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.footerGradient}
                        />
                        <View style={styles.footerContent}>
                            <View style={styles.gameInfo}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{game.category?.toUpperCase() || 'EXPERIENCE'}</Text>
                                </View>
                                <Text style={styles.title}>{game.title}</Text>
                                <Text style={styles.creator}>by {game.creator || 'Arcadia Core'}</Text>
                            </View>

                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Ionicons name="heart" size={18} color={colors.accent} />
                                    <Text style={styles.statText}>{game.likes?.toLocaleString() || '1.2k'}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="play" size={18} color={colors.textPrimary} />
                                    <Text style={styles.statText}>{game.plays?.toLocaleString() || '5.4k'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
            {isLoading && <LoadingState title={game.title} />}
            {hasError && <ErrorState />}
            {/* Only render WebView for games in preload range (active + adjacent) to save battery */}
            {isPreload ? (
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
                    injectedJavaScript={`
                        window.ARCADIA_CONFIG = ${JSON.stringify(game.config || {})};
                        true;
                    `}
                    onLoadEnd={handleLoadEnd}
                    onError={handleError}
                    onMessage={(event: any) => {
                        try {
                            const data = JSON.parse(event.nativeEvent.data);
                            const { type, action, payload } = data;

                            if (type === 'READY' || action === 'HEARTBEAT_READY') {
                                console.log(`[GameCard] ${game.title} is READY (Signal)`);
                                setIsLoading(false);
                                setHasError(false);
                            }

                            if (Platform.OS !== 'web') {
                                if (action === 'UX_HAPTIC') {
                                    const hapticType = payload?.type;
                                    showHUD(`Haptic: ${hapticType}`);
                                    switch (hapticType) {
                                        case 'impactLight': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
                                        case 'impactMedium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
                                        case 'impactHeavy': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
                                        case 'notificationSuccess': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
                                        case 'notificationWarning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
                                        case 'notificationError': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
                                        default: Haptics.selectionAsync();
                                    }
                                } else if (action === 'STATE_UPDATE') {
                                    showHUD(`Sync: ${payload?.key || 'State'}`);
                                    Haptics.selectionAsync();
                                    // Save progress on state update
                                    if (payload?.key === 'score' || payload?.key === 'level' || payload?.key === 'gameState') {
                                        gameProgressService.saveProgress(
                                            game.id,
                                            payload?.level || 1,
                                            payload?.value?.score || payload?.score || 0,
                                            payload?.value || null
                                        );
                                    }
                                } else if (action === 'FLOW_COMPLETE') {
                                    showHUD('Flow Complete ✓');
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    // Save final progress on game complete
                                    gameProgressService.saveProgress(
                                        game.id,
                                        payload?.level || payload?.metadata?.level || 1,
                                        payload?.score || payload?.points || 0,
                                        payload?.state || null,
                                        payload?.duration_ms || 0
                                    );
                                } else if (action === 'APP_CONFIG_UPDATE') {
                                    showHUD('Remote Settings Applied');
                                }
                            }
                            onGameEvent?.(action || type, payload);
                        } catch { }
                    }}
                    onContentProcessDidTerminate={handleContentProcessDidTerminate}
                    {...((Platform.OS as string) === 'web' && {
                        'data-game-id': game.id,
                    })}
                />
            ) : (
                <View style={styles.placeholder} />
            )}

            {/* Information Overlay for Native - Hide when playing */}
            {!isLoading && !hasError && !isPlaying && (
                <>
                    {/* Right Action Bar */}
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

                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                            <Ionicons name="chatbubble-ellipses" size={30} color="#FFF" style={styles.actionIconShadow} />
                            <Text style={styles.actionLabel}>{realStats.comments || '248'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                            <Ionicons name="share-social" size={30} color="#FFF" style={styles.actionIconShadow} />
                            <Text style={styles.actionLabel}>Share</Text>
                        </TouchableOpacity>

                        <View style={[styles.actionButton, styles.musicDiscContainer]}>
                            <LinearGradient
                                colors={['#333', colors.obsidian]}
                                style={styles.musicDisc}
                            >
                                <Ionicons name="musical-notes" size={16} color="#FFF" />
                            </LinearGradient>
                        </View>
                    </View>

                    {/* Footer Info */}
                    <View style={styles.footer} pointerEvents="none">
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                            style={styles.footerGradient}
                        />
                        <View style={styles.footerContent}>
                            <View style={styles.gameInfo}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{game.category?.toUpperCase() || 'EXPERIENCE'}</Text>
                                </View>
                                <Text style={styles.title}>{game.title}</Text>
                                <View style={styles.creatorRow}>
                                    <Text style={styles.creator}>by {game.creator || 'Arcadia Core'}</Text>
                                    <Text style={styles.separator}>•</Text>
                                    <Ionicons name="musical-note" size={12} color={colors.textSecondary} />
                                    <Text style={styles.musicInfo}>Original Sound - {game.title}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </>
            )}

            {/* Premium Experience HUD */}
            <Animated.View style={[
                styles.hudContainer,
                {
                    opacity: hudAnim,
                    transform: [{ translateY: hudAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: hudScale }]
                }
            ]}>
                <BlurView intensity={80} tint="dark" style={styles.hudBlur}>
                    <Ionicons name="flash" size={12} color={colors.accentBright} />
                    <Text style={styles.hudText}>{hudMessage}</Text>
                </BlurView>
            </Animated.View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: colors.void,
        overflow: 'hidden',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    hidden: {
        opacity: 0,
        position: 'absolute',
    },
    placeholder: {
        flex: 1,
        backgroundColor: colors.void,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.void,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    skeletonWrapper: {
        flex: 1,
        width: '100%',
    },
    skeletonContent: {
        padding: spacing.xl,
    },
    skeletonStats: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    loadingOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingTitle: {
        ...typography.displaySmall,
        color: colors.textPrimary,
        marginTop: spacing.md,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.void,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    errorGlow: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    errorTitle: {
        ...typography.headlineMedium,
        color: colors.danger,
    },
    errorSubtitle: {
        ...typography.bodyMedium,
        color: colors.textTertiary,
        marginTop: spacing.sm,
    },
    hudContainer: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        zIndex: 100,
    },
    hudBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    hudText: {
        ...typography.labelSmall,
        color: colors.textPrimary,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140, // Reduced from 180 for mobile
        zIndex: 5,
    },
    footerGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    footerContent: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: spacing.md,
        paddingBottom: 70, // Reduced from 100 for mobile navigation
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    gameInfo: {
        flex: 1,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.accentGlow,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.accent,
    },
    categoryText: {
        ...typography.labelSmall,
        color: colors.accent,
        fontWeight: '700',
        fontSize: 10,
    },
    title: {
        ...typography.displaySmall,
        color: colors.textPrimary,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    creator: {
        ...typography.bodyMedium,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statsContainer: {
        alignItems: 'flex-end',
        gap: spacing.sm,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.full,
    },
    statText: {
        ...typography.labelSmall,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    // New Premium Styles
    rightActionBar: {
        position: 'absolute',
        right: 8,
        bottom: 160, // Adjusted to sit above new footer
        zIndex: 20,
        alignItems: 'center',
        gap: 24,
    },
    actionButton: {
        alignItems: 'center',
        gap: 6,
    },
    actionIconShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    actionLabel: {
        ...typography.labelSmall,
        color: '#FFF',
        fontWeight: '600',
        fontSize: 12,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#FFF',
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    followBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: colors.accent,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    musicDiscContainer: {
        marginTop: 16,
    },
    musicDisc: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 6,
        borderColor: '#111',
        backgroundColor: '#222',
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        opacity: 0.9,
    },
    separator: {
        color: colors.textSecondary,
        marginHorizontal: 6,
        fontSize: 10,
    },
    musicInfo: {
        ...typography.labelSmall,
        color: '#FFF',
        marginLeft: 6,
        fontWeight: '500',
    },
    meshGradient: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    }
});

export default GameCard;
