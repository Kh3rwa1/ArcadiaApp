import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { gameProgressService } from '../services/gameProgressService';

type BridgeMessageType = 'LIFECYCLE' | 'APP' | 'UX';

interface BridgeMessage {
    version: '1.1';
    type: BridgeMessageType;
    action: string;
    payload?: unknown;
}

interface BridgeIncomingMessage {
    type?: string;
    action?: string;
    payload?: Record<string, unknown>;
}

type HapticType =
    | 'impactLight'
    | 'impactMedium'
    | 'impactHeavy'
    | 'notificationSuccess'
    | 'notificationWarning'
    | 'notificationError';

interface UseGameBridgeProps {
    gameId: string;
    gameTitle: string;
    gameConfig?: Record<string, unknown>;
    isActive: boolean;
    isPreload: boolean;
    webViewRef: React.RefObject<WebView | null>;
    onGameEvent?: (event: string, data: unknown) => void;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
    onLoadingChange?: (loading: boolean) => void;
    onErrorChange?: (error: boolean) => void;
    showHUD?: (message: string) => void;
}

interface UseGameBridgeReturn {
    sendMessage: (action: string, type?: BridgeMessageType, payload?: unknown) => void;
    handleNativeMessage: (event: { nativeEvent: { data: string } }) => void;
    handleContentProcessDidTerminate: () => void;
}

function triggerHapticFeedback(hapticType?: HapticType) {
    switch (hapticType) {
        case 'impactLight':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
        case 'impactMedium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
        case 'impactHeavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
        case 'notificationSuccess':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
        case 'notificationWarning':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
        case 'notificationError':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        default:
            Haptics.selectionAsync();
    }
}

function saveProgressFromPayload(
    gameId: string,
    payload?: Record<string, unknown>,
    durationMs = 0,
) {
    if (!payload) return;
    const level = (payload.level as number) || (payload.metadata as Record<string, unknown>)?.level as number || 1;
    const score = (payload.score as number) || (payload.points as number) || (payload.value as Record<string, unknown>)?.score as number || 0;
    const state = (payload.state || payload.value || null) as Record<string, unknown> | null;
    gameProgressService.saveProgress(gameId, level, score, state, durationMs);
}

export function useGameBridge({
    gameId,
    gameTitle,
    gameConfig,
    isActive,
    isPreload,
    webViewRef,
    onGameEvent,
    onInteractionStart,
    onInteractionEnd,
    onLoadingChange,
    onErrorChange,
    showHUD,
}: UseGameBridgeProps): UseGameBridgeReturn {
    const hasActiveInteractionRef = useRef(false);

    const triggerInteractionStart = useCallback(() => {
        if (!isActive || hasActiveInteractionRef.current) return;
        hasActiveInteractionRef.current = true;
        onInteractionStart?.();
    }, [isActive, onInteractionStart]);

    const triggerInteractionEnd = useCallback(() => {
        if (!hasActiveInteractionRef.current) return;
        hasActiveInteractionRef.current = false;
        onInteractionEnd?.();
    }, [onInteractionEnd]);

    const sendMessage = useCallback(
        (action: string, type: BridgeMessageType = 'LIFECYCLE', payload?: unknown) => {
            const message: BridgeMessage = { version: '1.1', type, action, payload };
            const json = JSON.stringify(message);

            if (Platform.OS === 'web') {
                const iframe = document.querySelector(
                    `iframe[data-game-id="${gameId}"]`,
                ) as HTMLIFrameElement;
                iframe?.contentWindow?.postMessage(json, '*');
            } else {
                const script = `
                    if(window.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('DURRA_Bridge', {
                            detail: ${json}
                        }));
                    }
                    true;
                `;
                webViewRef.current?.injectJavaScript(script);
            }
        },
        [gameId, webViewRef],
    );

    const handleNativeMessage = useCallback(
        (event: { nativeEvent: { data: string } }) => {
            try {
                const data: BridgeIncomingMessage = JSON.parse(event.nativeEvent.data);
                const { type, action, payload } = data;

                if (type === 'READY' || action === 'HEARTBEAT_READY') {
                    console.log(`[GameBridge] ${gameTitle} is READY (Signal)`);
                    onLoadingChange?.(false);
                    onErrorChange?.(false);
                }

                if (action === 'FLOW_START' || action === 'START' || action === 'GAME_START') {
                    triggerInteractionStart();
                }

                if (action === 'GAME_OVER' || action === 'GAME_COMPLETE' || action === 'FLOW_COMPLETE') {
                    triggerInteractionEnd();
                }

                if (Platform.OS !== 'web') {
                    if (action === 'UX_HAPTIC') {
                        const hapticType = payload?.type as HapticType | undefined;
                        showHUD?.(`Haptic: ${hapticType}`);
                        triggerHapticFeedback(hapticType);
                    } else if (action === 'STATE_UPDATE') {
                        showHUD?.(`Sync: ${payload?.key || 'State'}`);
                        Haptics.selectionAsync();
                        if (
                            payload?.key === 'score' ||
                            payload?.key === 'level' ||
                            payload?.key === 'gameState'
                        ) {
                            gameProgressService.saveProgress(
                                gameId,
                                payload?.level as number || 1,
                                (payload?.value as Record<string, unknown>)?.score as number || payload?.score as number || 0,
                                (payload?.value || null) as Record<string, unknown> | null,
                            );
                        }
                    } else if (action === 'FLOW_COMPLETE') {
                        showHUD?.('Flow Complete ✓');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        saveProgressFromPayload(gameId, payload);
                    } else if (action === 'APP_CONFIG_UPDATE') {
                        showHUD?.('Remote Settings Applied');
                    }
                }

                onGameEvent?.((action || type) as string, payload);
            } catch {
                // Silently ignore malformed messages
            }
        },
        [gameId, gameTitle, onGameEvent, onLoadingChange, onErrorChange, showHUD, triggerInteractionStart, triggerInteractionEnd],
    );

    const handleContentProcessDidTerminate = useCallback(() => {
        console.warn(`[GameBridge] ${gameTitle} WebView process terminated, reloading...`);
        onLoadingChange?.(true);
        onErrorChange?.(false);
        webViewRef.current?.reload();
    }, [gameTitle, webViewRef, onLoadingChange, onErrorChange]);

    // Lifecycle: RESUME / PAUSE when active state changes
    useEffect(() => {
        if (isActive) {
            sendMessage('LIFECYCLE_RESUME');
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            console.log(`[GameBridge] ${gameTitle} (Active)`);
        } else {
            sendMessage('LIFECYCLE_PAUSE');
        }
    }, [isActive, sendMessage, gameTitle]);

    // Lifecycle: STOP when game leaves preload range (battery optimization)
    useEffect(() => {
        if (!isPreload && !isActive) {
            sendMessage('LIFECYCLE_STOP');
            console.log(`[GameBridge] ${gameTitle} STOPPED (out of range)`);
        }
    }, [isPreload, isActive, sendMessage, gameTitle]);

    // Web bridge listener for messages from iframe
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data: BridgeIncomingMessage =
                    typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data?.action) {
                    onGameEvent?.(data.action, data.payload);
                }
            } catch {
                // Silently ignore
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onGameEvent]);

    // Web: detect iframe interaction via window blur
    useEffect(() => {
        if (Platform.OS !== 'web' || !isActive) return;

        const handleBlur = () => {
            const activeEl = document.activeElement;
            if (
                activeEl?.tagName === 'IFRAME' &&
                (activeEl as HTMLIFrameElement).dataset?.gameId === gameId
            ) {
                triggerInteractionStart();
            }
        };

        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [gameId, isActive, triggerInteractionStart]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            triggerInteractionEnd();
            if (Platform.OS !== 'web' && webViewRef.current) {
                webViewRef.current.stopLoading();
                webViewRef.current.injectJavaScript('window.DURRA_CONFIG = null; true;');
            }
        };
    }, [triggerInteractionEnd, webViewRef]);

    // End interaction when deactivated
    useEffect(() => {
        if (!isActive) {
            triggerInteractionEnd();
        }
    }, [isActive, triggerInteractionEnd]);

    return {
        sendMessage,
        handleNativeMessage,
        handleContentProcessDidTerminate,
    };
}
