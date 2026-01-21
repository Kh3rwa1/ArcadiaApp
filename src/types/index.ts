export interface Game {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    game_url: string;
    version: string;
    creator?: string;
    category?: string;
    trending?: boolean;
    likes?: number;
    plays?: number;
    settings?: {
        is_featured?: boolean;
        allow_restart?: boolean;
        show_leaderboard?: boolean;
    };
    type?: 'game' | 'utility' | 'tool' | 'social';
    config?: Record<string, unknown>;
}

export interface Creator {
    id: string;
    name: string;
    handle: string;
    avatar?: string;
    verified?: boolean;
    followers?: number;
}

export interface AnalyticsEvent {
    game_uuid: string;
    user_uuid: string;
    event_type: 'impression' | 'start' | 'end' | 'completion' | 'like' | 'share' | 'bookmark' | 'restart' | 'score_update' | 'crash' | 'flow_complete';
    duration_ms?: number;
    metadata?: Record<string, unknown>;
}

export interface FeedResponse {
    games: Game[];
    cursor?: string;
    hasMore: boolean;
}

export interface UserPreferences {
    likedGames: string[];
    bookmarkedGames: string[];
    followedCreators: string[];
}

export interface GameProgress {
    gameId: string;
    currentLevel: number;
    highScore: number;
    totalScore: number;
    state: Record<string, unknown> | null;
    playCount: number;
    totalTimeMs: number;
    lastPlayedAt: string | null;
}

