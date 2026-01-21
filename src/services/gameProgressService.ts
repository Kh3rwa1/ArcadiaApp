import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { GameProgress } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// GAME PROGRESS SERVICE
// Handles save/load with offline-first strategy and background sync
// ═══════════════════════════════════════════════════════════════════════════

const TUNNEL_URL = 'https://arcadia-api-2025.loca.lt';
const LOCAL_IP = '192.168.0.101';

const API_BASE = Platform.OS === 'web'
    ? 'http://localhost:8000'
    : `http://${LOCAL_IP}:8000`;

const STORAGE_KEYS = {
    PROGRESS_PREFIX: 'game_progress_',
    SYNC_QUEUE: 'progress_sync_queue',
    USER_UUID: 'user_uuid',
};

interface SyncQueueItem {
    gameId: string;
    level: number;
    score: number;
    state: Record<string, unknown> | null;
    durationMs: number;
    timestamp: number;
}

/**
 * Game Progress Service - Offline-first with background sync
 */
export const gameProgressService = {
    /**
     * Get user UUID (create if not exists)
     */
    async getUserId(): Promise<string> {
        let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_UUID);
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_UUID, userId);
        }
        return userId;
    },

    /**
     * Load progress for a game (local first, then server)
     */
    async loadProgress(gameId: string): Promise<GameProgress | null> {
        try {
            // 1. Try local storage first (fast)
            const localData = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + gameId);
            const localProgress: GameProgress | null = localData ? JSON.parse(localData) : null;

            // 2. Try to fetch from server (background update)
            const userId = await this.getUserId();
            const serverProgress = await this.fetchProgressFromServer(gameId, userId);

            if (serverProgress) {
                // Merge: take highest scores, merge state
                const merged = this.mergeProgress(localProgress, serverProgress);
                await this.saveProgressLocally(gameId, merged);
                return merged;
            }

            return localProgress;
        } catch (e) {
            console.warn('[GameProgress] Load failed:', e);
            // Fall back to local only
            const localData = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + gameId);
            return localData ? JSON.parse(localData) : null;
        }
    },

    /**
     * Save progress (local immediately, queue for server sync)
     */
    async saveProgress(
        gameId: string,
        level: number,
        score: number,
        state: Record<string, unknown> | null = null,
        durationMs: number = 0
    ): Promise<void> {
        try {
            // 1. Load existing progress
            const existing = await this.loadProgressLocally(gameId);

            // 2. Create updated progress
            const updated: GameProgress = {
                gameId,
                currentLevel: Math.max(existing?.currentLevel || 1, level),
                highScore: Math.max(existing?.highScore || 0, score),
                totalScore: (existing?.totalScore || 0) + score,
                state: state ? { ...(existing?.state || {}), ...state } : existing?.state || null,
                playCount: (existing?.playCount || 0) + 1,
                totalTimeMs: (existing?.totalTimeMs || 0) + durationMs,
                lastPlayedAt: new Date().toISOString(),
            };

            // 3. Save locally (immediate)
            await this.saveProgressLocally(gameId, updated);

            // 4. Queue for server sync
            await this.addToSyncQueue({
                gameId,
                level,
                score,
                state,
                durationMs,
                timestamp: Date.now(),
            });

            // 5. Attempt background sync
            this.syncToServer();
        } catch (e) {
            console.warn('[GameProgress] Save failed:', e);
        }
    },

    /**
     * Load progress from local storage only
     */
    async loadProgressLocally(gameId: string): Promise<GameProgress | null> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + gameId);
        return data ? JSON.parse(data) : null;
    },

    /**
     * Save progress to local storage
     */
    async saveProgressLocally(gameId: string, progress: GameProgress): Promise<void> {
        await AsyncStorage.setItem(
            STORAGE_KEYS.PROGRESS_PREFIX + gameId,
            JSON.stringify(progress)
        );
    },

    /**
     * Fetch progress from server
     */
    async fetchProgressFromServer(gameId: string, userId: string): Promise<GameProgress | null> {
        try {
            const response = await fetch(
                `${API_BASE}/api/v1/progress/${gameId}?user_uuid=${userId}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );

            if (!response.ok) return null;

            const json = await response.json();
            if (json.status !== 'success') return null;

            const data = json.data;
            return {
                gameId,
                currentLevel: data.current_level,
                highScore: data.high_score,
                totalScore: data.total_score,
                state: data.state,
                playCount: data.play_count,
                totalTimeMs: data.total_time_ms,
                lastPlayedAt: data.last_played_at,
            };
        } catch {
            return null;
        }
    },

    /**
     * Merge local and server progress (take best of both)
     */
    mergeProgress(local: GameProgress | null, server: GameProgress | null): GameProgress {
        if (!local) return server!;
        if (!server) return local;

        return {
            gameId: local.gameId,
            currentLevel: Math.max(local.currentLevel, server.currentLevel),
            highScore: Math.max(local.highScore, server.highScore),
            totalScore: Math.max(local.totalScore, server.totalScore),
            state: { ...(server.state || {}), ...(local.state || {}) }, // Local wins for state
            playCount: Math.max(local.playCount, server.playCount),
            totalTimeMs: Math.max(local.totalTimeMs, server.totalTimeMs),
            lastPlayedAt: local.lastPlayedAt && server.lastPlayedAt
                ? (new Date(local.lastPlayedAt) > new Date(server.lastPlayedAt) ? local.lastPlayedAt : server.lastPlayedAt)
                : local.lastPlayedAt || server.lastPlayedAt,
        };
    },

    /**
     * Add item to sync queue
     */
    async addToSyncQueue(item: SyncQueueItem): Promise<void> {
        const queue = await this.getSyncQueue();
        queue.push(item);
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    },

    /**
     * Get sync queue
     */
    async getSyncQueue(): Promise<SyncQueueItem[]> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Clear sync queue
     */
    async clearSyncQueue(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    },

    /**
     * Sync pending items to server
     */
    async syncToServer(): Promise<void> {
        try {
            const queue = await this.getSyncQueue();
            if (queue.length === 0) return;

            const userId = await this.getUserId();

            // Group by game for batch efficiency
            const progressByGame = queue.reduce((acc, item) => {
                if (!acc[item.gameId]) {
                    acc[item.gameId] = { level: 0, score: 0, state: {}, durationMs: 0 };
                }
                acc[item.gameId].level = Math.max(acc[item.gameId].level, item.level);
                acc[item.gameId].score += item.score;
                acc[item.gameId].durationMs += item.durationMs;
                if (item.state) {
                    acc[item.gameId].state = { ...acc[item.gameId].state, ...item.state };
                }
                return acc;
            }, {} as Record<string, { level: number; score: number; state: Record<string, unknown>; durationMs: number }>);

            // Send batch request
            const progressArray = Object.entries(progressByGame).map(([gameId, data]) => ({
                game_uuid: gameId,
                level: data.level,
                score: data.score,
                state: Object.keys(data.state).length > 0 ? data.state : null,
                duration_ms: data.durationMs,
            }));

            const response = await fetch(`${API_BASE}/api/v1/progress/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_uuid: userId, progress: progressArray }),
            });

            if (response.ok) {
                await this.clearSyncQueue();
                console.log('[GameProgress] Synced', progressArray.length, 'games to server');
            }
        } catch (e) {
            console.warn('[GameProgress] Sync failed, will retry:', e);
        }
    },

    /**
     * Get all local progress for profile display
     */
    async getAllProgress(): Promise<GameProgress[]> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.PROGRESS_PREFIX));
            const items = await AsyncStorage.multiGet(progressKeys);
            return items
                .map(([_, value]) => value ? JSON.parse(value) : null)
                .filter(Boolean) as GameProgress[];
        } catch {
            return [];
        }
    },
};
