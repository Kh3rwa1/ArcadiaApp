import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameProgress } from '../types';
import { getLaravelApiBase } from '../config/environment';

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

export const gameProgressService = {
    async getUserId(): Promise<string> {
        let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_UUID);
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_UUID, userId);
        }
        return userId;
    },

    async loadProgress(gameId: string): Promise<GameProgress | null> {
        try {
            const localData = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + gameId);
            const localProgress: GameProgress | null = localData ? JSON.parse(localData) : null;

            const userId = await this.getUserId();
            const serverProgress = await this.fetchProgressFromServer(gameId, userId);

            if (serverProgress) {
                const merged = this.mergeProgress(localProgress, serverProgress);
                await this.saveProgressLocally(gameId, merged);
                return merged;
            }

            return localProgress;
        } catch {
            const localData = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + gameId);
            return localData ? JSON.parse(localData) : null;
        }
    },

    async saveProgress(
        gameId: string,
        level: number,
        score: number,
        state: Record<string, unknown> | null = null,
        durationMs: number = 0
    ): Promise<void> {
        try {
            const existing = await this.loadProgressLocally(gameId);

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

            await this.saveProgressLocally(gameId, updated);

            await this.addToSyncQueue({
                gameId, level, score, state, durationMs, timestamp: Date.now(),
            });

            this.syncToServer();
        } catch {
            // Progress saved locally at minimum
        }
    },

    async loadProgressLocally(gameId: string): Promise<GameProgress | null> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + gameId);
        return data ? JSON.parse(data) : null;
    },

    async saveProgressLocally(gameId: string, progress: GameProgress): Promise<void> {
        await AsyncStorage.setItem(
            STORAGE_KEYS.PROGRESS_PREFIX + gameId,
            JSON.stringify(progress)
        );
    },

    async fetchProgressFromServer(gameId: string, userId: string): Promise<GameProgress | null> {
        try {
            const API_BASE = getLaravelApiBase();
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

    mergeProgress(local: GameProgress | null, server: GameProgress | null): GameProgress {
        if (!local) return server!;
        if (!server) return local;

        return {
            gameId: local.gameId,
            currentLevel: Math.max(local.currentLevel, server.currentLevel),
            highScore: Math.max(local.highScore, server.highScore),
            totalScore: Math.max(local.totalScore, server.totalScore),
            state: { ...(server.state || {}), ...(local.state || {}) },
            playCount: Math.max(local.playCount, server.playCount),
            totalTimeMs: Math.max(local.totalTimeMs, server.totalTimeMs),
            lastPlayedAt: local.lastPlayedAt && server.lastPlayedAt
                ? (new Date(local.lastPlayedAt) > new Date(server.lastPlayedAt) ? local.lastPlayedAt : server.lastPlayedAt)
                : local.lastPlayedAt || server.lastPlayedAt,
        };
    },

    async addToSyncQueue(item: SyncQueueItem): Promise<void> {
        const queue = await this.getSyncQueue();
        queue.push(item);
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    },

    async getSyncQueue(): Promise<SyncQueueItem[]> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
        return data ? JSON.parse(data) : [];
    },

    async clearSyncQueue(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    },

    async syncToServer(): Promise<void> {
        try {
            const queue = await this.getSyncQueue();
            if (queue.length === 0) return;

            const userId = await this.getUserId();
            const API_BASE = getLaravelApiBase();

            const progressByGame = queue.reduce<Record<string, { level: number; score: number; state: Record<string, unknown>; durationMs: number }>>((acc, item) => {
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
            }, {});

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
            }
        } catch {
            // Will retry on next sync
        }
    },

    async getAllProgress(): Promise<GameProgress[]> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.PROGRESS_PREFIX));
            const items = await AsyncStorage.multiGet(progressKeys);
            return items
                .map(([, value]) => value ? JSON.parse(value) : null)
                .filter(Boolean) as GameProgress[];
        } catch {
            return [];
        }
    },
};
