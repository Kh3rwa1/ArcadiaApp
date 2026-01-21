import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface StreakData {
    current: number;
    longest: number;
    lastLoginDate: string; // ISO date string (YYYY-MM-DD)
}

export interface UserStats {
    gamesPlayed: number;
    totalPlayTimeMs: number;
    highestScore: number;
    totalXP: number;
    favoriteCategory: string | null;
}

export interface UserProfile {
    userId: string;
    username: string;
    avatarInitials: string;
    streak: StreakData;
    stats: UserStats;
    level: number;
    achievements: string[];
    createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
    USER_PROFILE: 'user_profile',
    RECENT_GAMES: 'recent_games',
    GAME_HISTORY: 'game_history',
};

const XP_PER_LEVEL = 500;
const XP_PER_GAME = 10;
const XP_PER_MINUTE = 2;

// ═══════════════════════════════════════════════════════════════════════════
// User Service
// ═══════════════════════════════════════════════════════════════════════════

export const userService = {
    /**
     * Get today's date in YYYY-MM-DD format
     */
    getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Get yesterday's date in YYYY-MM-DD format
     */
    getYesterdayDate(): string {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    },

    /**
     * Calculate level from XP
     */
    calculateLevel(xp: number): number {
        return Math.floor(xp / XP_PER_LEVEL) + 1;
    },

    /**
     * Get XP progress to next level (0-100%)
     */
    getLevelProgress(xp: number): number {
        return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
    },

    /**
     * Get or create user profile
     */
    async getProfile(): Promise<UserProfile> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
            if (data) {
                const profile = JSON.parse(data);
                // Check and update streak on profile load
                return await this.checkAndUpdateStreak(profile);
            }
        } catch (e) {
            console.warn('Failed to get profile:', e);
        }

        // Create new profile
        const newProfile = await this.createDefaultProfile();
        await this.saveProfile(newProfile);
        return newProfile;
    },

    /**
     * Create default profile for new users
     */
    async createDefaultProfile(): Promise<UserProfile> {
        // Generate userId
        const userId = 'user_' + Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        return {
            userId,
            username: 'Player',
            avatarInitials: 'PL',
            streak: {
                current: 1,
                longest: 1,
                lastLoginDate: this.getTodayDate(),
            },
            stats: {
                gamesPlayed: 0,
                totalPlayTimeMs: 0,
                highestScore: 0,
                totalXP: 0,
                favoriteCategory: null,
            },
            level: 1,
            achievements: [],
            createdAt: new Date().toISOString(),
        };
    },

    /**
     * Save profile to storage
     */
    async saveProfile(profile: UserProfile): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        } catch (e) {
            console.warn('Failed to save profile:', e);
        }
    },

    /**
     * Check and update daily streak
     */
    async checkAndUpdateStreak(profile: UserProfile): Promise<UserProfile> {
        const today = this.getTodayDate();
        const yesterday = this.getYesterdayDate();
        const lastLogin = profile.streak.lastLoginDate;

        if (lastLogin === today) {
            // Already logged in today, no change
            return profile;
        }

        let newStreak = profile.streak.current;

        if (lastLogin === yesterday) {
            // Consecutive day - increase streak!
            newStreak = profile.streak.current + 1;
        } else {
            // Streak broken - reset to 1
            newStreak = 1;
        }

        // Calculate streak bonus XP
        const streakBonus = this.getStreakXPBonus(newStreak);

        const updatedProfile: UserProfile = {
            ...profile,
            streak: {
                current: newStreak,
                longest: Math.max(newStreak, profile.streak.longest),
                lastLoginDate: today,
            },
            stats: {
                ...profile.stats,
                totalXP: profile.stats.totalXP + streakBonus,
            },
            level: this.calculateLevel(profile.stats.totalXP + streakBonus),
        };

        await this.saveProfile(updatedProfile);
        return updatedProfile;
    },

    /**
     * Get XP bonus based on streak length
     */
    getStreakXPBonus(streak: number): number {
        if (streak >= 30) return 100;
        if (streak >= 14) return 50;
        if (streak >= 7) return 25;
        if (streak >= 3) return 10;
        return 5;
    },

    /**
     * Track a game session
     */
    async trackGameSession(gameId: string, durationMs: number, score: number, category?: string): Promise<UserProfile> {
        const profile = await this.getProfile();

        // Calculate XP earned
        const playTimeMinutes = Math.floor(durationMs / 60000);
        const xpEarned = XP_PER_GAME + (playTimeMinutes * XP_PER_MINUTE);

        const updatedProfile: UserProfile = {
            ...profile,
            stats: {
                ...profile.stats,
                gamesPlayed: profile.stats.gamesPlayed + 1,
                totalPlayTimeMs: profile.stats.totalPlayTimeMs + durationMs,
                highestScore: Math.max(profile.stats.highestScore, score),
                totalXP: profile.stats.totalXP + xpEarned,
                favoriteCategory: category || profile.stats.favoriteCategory,
            },
            level: this.calculateLevel(profile.stats.totalXP + xpEarned),
        };

        // Check for achievements
        updatedProfile.achievements = this.checkAchievements(updatedProfile);

        await this.saveProfile(updatedProfile);

        // Add to recent games
        await this.addToRecentGames(gameId);

        return updatedProfile;
    },

    /**
     * Add game to recent games history
     */
    async addToRecentGames(gameId: string): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_GAMES);
            let recentGames: string[] = data ? JSON.parse(data) : [];

            // Remove if already exists, add to front
            recentGames = recentGames.filter(id => id !== gameId);
            recentGames.unshift(gameId);

            // Keep only last 20
            recentGames = recentGames.slice(0, 20);

            await AsyncStorage.setItem(STORAGE_KEYS.RECENT_GAMES, JSON.stringify(recentGames));
        } catch (e) {
            console.warn('Failed to update recent games:', e);
        }
    },

    /**
     * Get recent games
     */
    async getRecentGames(): Promise<string[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_GAMES);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    /**
     * Check and award achievements
     */
    checkAchievements(profile: UserProfile): string[] {
        const achievements = [...profile.achievements];

        // First game
        if (profile.stats.gamesPlayed >= 1 && !achievements.includes('pioneer')) {
            achievements.push('pioneer');
        }

        // 7 day streak
        if (profile.streak.current >= 7 && !achievements.includes('7d_streak')) {
            achievements.push('7d_streak');
        }

        // 10 games played
        if (profile.stats.gamesPlayed >= 10 && !achievements.includes('enthusiast')) {
            achievements.push('enthusiast');
        }

        // 100 games played
        if (profile.stats.gamesPlayed >= 100 && !achievements.includes('veteran')) {
            achievements.push('veteran');
        }

        // 30 day streak
        if (profile.streak.current >= 30 && !achievements.includes('dedicated')) {
            achievements.push('dedicated');
        }

        // Level 10
        if (profile.level >= 10 && !achievements.includes('rising_star')) {
            achievements.push('rising_star');
        }

        return achievements;
    },

    /**
     * Update username
     */
    async updateUsername(username: string): Promise<UserProfile> {
        const profile = await this.getProfile();
        const initials = username.substring(0, 2).toUpperCase();

        const updatedProfile: UserProfile = {
            ...profile,
            username,
            avatarInitials: initials,
        };

        await this.saveProfile(updatedProfile);
        return updatedProfile;
    },

    /**
     * Format playtime for display (e.g., "2h 15m")
     */
    formatPlayTime(ms: number): string {
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    },

    /**
     * Format number for display (e.g., 1234 -> "1.2k")
     */
    formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return num.toString();
    },
};
