import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Game, AnalyticsEvent } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// API Configuration
// ═══════════════════════════════════════════════════════════════════════════

// For testing on physical devices, use the localtunnel URL or your machine's local IP
const TUNNEL_URL = 'https://arcadia-api-2025.loca.lt';
const LOCAL_IP = '192.168.0.101'; // User's current network IP

const API_BASE = Platform.OS === 'web'
    ? ''
    : `http://${LOCAL_IP}:8000`; // Preference for local IP over unstable tunnel for local testing

// ═══════════════════════════════════════════════════════════════════════════
// Game Catalog — Premium curated collection
// ═══════════════════════════════════════════════════════════════════════════

const GAME_CATALOG: Game[] = [
    {
        id: 'neon-uuid',
        title: 'Neon Clicker',
        description: 'Tap to the rhythm and chase the neon high score! How fast can you go?',
        game_url: `${API_BASE}/games/neon-uuid/v1/index.html`,
        version: 'v1.2.4',
        creator: 'Arcadia Labs',
        category: 'Arcade',
        trending: true,
        likes: 12847,
        plays: 45200,
    },
    {
        id: 'zen-uuid',
        title: 'Zen Balancer',
        description: 'Find your inner peace through the art of balance. A meditative experience.',
        game_url: `${API_BASE}/games/zen-uuid/v1/index.html`,
        version: 'v2.0.1',
        creator: 'Mindful Games',
        category: 'Relaxation',
        trending: false,
        likes: 8234,
        plays: 28100,
    },
    {
        id: 'dot-hunter',
        title: 'Dot Hunter',
        description: 'Hunt the dots, collect the points, beat the clock! Fast-paced action.',
        game_url: `${API_BASE}/games/dot-hunter/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Speed Studios',
        category: 'Action',
        trending: true,
        likes: 6891,
        plays: 21500,
    },
    {
        id: 'color-match',
        title: 'Color Match',
        description: 'Test your reflexes in this colorful matching challenge!',
        game_url: `${API_BASE}/games/color-match/v1/index.html`,
        version: 'v1.1.0',
        creator: 'Arcadia Labs',
        category: 'Puzzle',
        trending: false,
        likes: 4520,
        plays: 15800,
    },
    {
        id: 'gravity-jump',
        title: 'Gravity Jump',
        description: 'Defy gravity and reach new heights in this endless jumper!',
        game_url: `${API_BASE}/games/gravity-jump/v1/index.html`,
        version: 'v1.0.3',
        creator: 'Sky High Games',
        category: 'Endless',
        trending: true,
        likes: 9872,
        plays: 38400,
    },
    {
        id: 'math-dash',
        title: 'Math Dash',
        description: 'Race against time to solve equations. Brain training made fun!',
        game_url: `${API_BASE}/games/math-dash/v1/index.html`,
        version: 'v1.0.0',
        creator: 'EduPlay',
        category: 'Educational',
        trending: false,
        likes: 3210,
        plays: 12100,
    },
    {
        id: 'memory-flip',
        title: 'Memory Flip',
        description: 'Classic memory game with a modern twist. How sharp is your memory?',
        game_url: `${API_BASE}/games/memory-flip/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Brain',
        trending: false,
        likes: 5640,
        plays: 19200,
    },
    {
        id: 'arcadia-bird',
        title: 'Arcadia Bird',
        description: 'Tap to defy gravity in this neon-soaked challenge.',
        game_url: `${API_BASE}/games/arcadia-bird/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Action',
        trending: true,
        likes: 15400,
        plays: 89000,
    },
    {
        id: 'arcadia-blocks',
        title: 'Arcadia Blocks',
        description: 'Minimalist geometry in motion. Stack, clear, evolve.',
        game_url: `${API_BASE}/games/arcadia-blocks/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Arcade',
        trending: true,
        likes: 12100,
        plays: 45000,
    },
    {
        id: 'neon-nebula',
        title: 'Neon Nebula',
        description: 'Stunning particle experience. Tether the light.',
        game_url: `${API_BASE}/games/neon-nebula/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Zen',
        trending: true,
        likes: 9800,
        plays: 32000,
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // New Games - Babylon.js & Three.js
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'nebula-drift',
        title: 'Nebula Drift',
        description: 'Navigate through cosmic debris in this stunning space flight experience.',
        game_url: `${API_BASE}/games/nebula-drift/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Action',
        trending: true,
        likes: 8200,
        plays: 28000,
    },
    {
        id: 'voxel-runner',
        title: 'Voxel Runner',
        description: 'Race through a synthwave city. Dodge obstacles, survive the neon.',
        game_url: `${API_BASE}/games/voxel-runner/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Endless',
        trending: true,
        likes: 11500,
        plays: 42000,
    },
    {
        id: 'cyber-golf',
        title: 'Cyber Golf',
        description: 'Futuristic mini-golf with gravity wells and teleport pads.',
        game_url: `${API_BASE}/games/cyber-golf/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Arcade',
        trending: false,
        likes: 6800,
        plays: 19000,
    },
    {
        id: 'sphere-quest',
        title: 'Sphere Quest',
        description: 'Tilt and roll through marble mazes in this physics puzzle.',
        game_url: `${API_BASE}/games/sphere-quest/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Puzzle',
        trending: false,
        likes: 5400,
        plays: 15000,
    },
    {
        id: 'neon-knights',
        title: 'Neon Knights',
        description: 'Arena survival combat. Defeat waves of geometric enemies.',
        game_url: `${API_BASE}/games/neon-knights/v1/index.html`,
        version: 'v1.0.0',
        creator: 'Arcadia Labs',
        category: 'Action',
        trending: true,
        likes: 14200,
        plays: 51000,
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // AAA Mobile-Optimized Games (Canvas2D)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'quantum-racer',
        title: 'Quantum Racer',
        description: 'High-speed endless runner through neon corridors. Dodge obstacles, boost to victory!',
        game_url: `${API_BASE}/games/quantum-racer/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Endless',
        trending: true,
        likes: 18500,
        plays: 72000,
    },
    {
        id: 'shadow-striker',
        title: 'Shadow Striker',
        description: 'Combat arena action. Defeat enemy waves with swift attacks!',
        game_url: `${API_BASE}/games/shadow-striker/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Action',
        trending: true,
        likes: 16200,
        plays: 58000,
    },
    {
        id: 'neon-drift',
        title: 'Neon Drift',
        description: 'Synthwave racing with drift scoring. Master the curves!',
        game_url: `${API_BASE}/games/neon-drift/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Arcade',
        trending: true,
        likes: 15800,
        plays: 55000,
    },
    {
        id: 'crystal-caverns',
        title: 'Crystal Caverns',
        description: 'Collect magical crystals in cavernous puzzles. Navigate wisely!',
        game_url: `${API_BASE}/games/crystal-caverns/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Puzzle',
        trending: false,
        likes: 9400,
        plays: 32000,
    },
    {
        id: 'gravity-shift',
        title: 'Gravity Shift',
        description: 'Zero-G platformer. Shift gravity to collect orbs!',
        game_url: `${API_BASE}/games/gravity-shift/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Puzzle',
        trending: true,
        likes: 12100,
        plays: 41000,
    },
    {
        id: 'cyber-siege',
        title: 'Cyber Siege',
        description: 'Tower defense with turrets. Protect your base from waves of enemies!',
        game_url: `${API_BASE}/games/cyber-siege/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Strategy',
        trending: true,
        likes: 14700,
        plays: 48000,
    },
    {
        id: 'photon-blaster',
        title: 'Photon Blaster',
        description: 'Space shooter with auto-fire. Survive the cosmic onslaught!',
        game_url: `${API_BASE}/games/photon-blaster/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Action',
        trending: true,
        likes: 17300,
        plays: 63000,
    },
    {
        id: 'lava-escape',
        title: 'Lava Escape',
        description: 'Endless climber with rising lava. Jump to survive!',
        game_url: `${API_BASE}/games/lava-escape/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Endless',
        trending: true,
        likes: 13900,
        plays: 52000,
    },
    {
        id: 'circuit-breaker',
        title: 'Circuit Breaker',
        description: 'Connection puzzle. Rotate nodes to complete the circuit!',
        game_url: `${API_BASE}/games/circuit-breaker/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Brain',
        trending: false,
        likes: 8200,
        plays: 28000,
    },
    {
        id: 'astro-miner',
        title: 'Astro Miner',
        description: 'Space mining adventure. Harvest asteroids for credits!',
        game_url: `${API_BASE}/games/astro-miner/v1/index.html`,
        version: 'v2.0.0',
        creator: 'Arcadia Labs',
        category: 'Arcade',
        trending: false,
        likes: 10500,
        plays: 35000,
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// API Service
// ═══════════════════════════════════════════════════════════════════════════

export const api = {
    /**
     * Get the game feed with optional cursor pagination
     * Uses local catalog as primary source (correct URLs), enriched with backend metadata
     */
    async getFeed(cursor?: string): Promise<Game[]> {
        try {
            const url = cursor
                ? `${API_BASE}/api/v1/feed?cursor=${cursor}`
                : `${API_BASE}/api/v1/feed`;

            const response = await fetch(url);
            const json = await response.json();

            if (json.status === 'success') {
                // Handle paginated response structure
                const gamesData = json.data.data || json.data;
                return gamesData.map((game: any) => ({
                    ...game,
                    // Map backend categories to frontend category for filtering
                    category: game.category || game.settings?.categories?.[0] || 'Game',
                    // Prepend API_BASE if game_url is a relative path
                    game_url: game.game_url?.startsWith('/')
                        ? `${API_BASE}${game.game_url}`
                        : game.game_url
                }));
            }
            return [];
        } catch (e) {
            console.warn('Feed fetch failed, falling back to local catalog:', e);
            // Shuffled fallback for development resilience
            return [...GAME_CATALOG].sort(() => Math.random() - 0.5);
        }
    },

    /**
     * Get a single game by ID
     */
    async getGame(id: string): Promise<Game | null> {
        return GAME_CATALOG.find(g => g.id === id) || null;
    },

    /**
     * Track an analytics event
     */
    async trackEvent(event: AnalyticsEvent): Promise<any> {
        try {
            // For scoring events, we want instant feedback (percentile)
            if (event.event_type === 'score_update') {
                const response = await fetch(`${API_BASE}/api/v1/analytics/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event),
                });
                return await response.json();
            }

            // Other events can be queued
            const events = await this.getQueuedEvents();
            events.push({ ...event, timestamp: Date.now() });
            await AsyncStorage.setItem('analytics_queue', JSON.stringify(events));

            if (events.length >= 5) {
                await this.flushEvents();
            }
            return { status: 'queued' };
        } catch (e) {
            console.warn('Analytics tracking failed:', e);
            return { status: 'error' };
        }
    },

    /**
     * Get queued analytics events
     */
    async getQueuedEvents(): Promise<any[]> {
        try {
            const data = await AsyncStorage.getItem('analytics_queue');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    /**
     * Flush queued events to the server
     */
    async flushEvents(): Promise<void> {
        try {
            const events = await this.getQueuedEvents();
            if (events.length === 0) return;

            await fetch(`${API_BASE}/api/v1/analytics/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events }),
            });

            await AsyncStorage.removeItem('analytics_queue');
        } catch (e) {
            console.warn('Analytics flush failed:', e);
        }
    },

    /**
     * Get or create a unique user ID
     */
    async getUserId(): Promise<string> {
        let userId = await AsyncStorage.getItem('user_uuid');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
            await AsyncStorage.setItem('user_uuid', userId);
        }
        return userId;
    },

    /**
     * Get user preferences (likes, bookmarks, follows)
     */
    async getUserPreferences(): Promise<{
        likedGames: string[];
        bookmarkedGames: string[];
        followedCreators: string[];
    }> {
        try {
            const data = await AsyncStorage.getItem('user_preferences');
            return data ? JSON.parse(data) : {
                likedGames: [],
                bookmarkedGames: [],
                followedCreators: [],
            };
        } catch {
            return {
                likedGames: [],
                bookmarkedGames: [],
                followedCreators: [],
            };
        }
    },

    /**
     * Save user preferences
     */
    async saveUserPreferences(prefs: {
        likedGames: string[];
        bookmarkedGames: string[];
        followedCreators: string[];
    }): Promise<void> {
        await AsyncStorage.setItem('user_preferences', JSON.stringify(prefs));
    },

    /**
     * Report a game issue
     */
    async reportGame(gameId: string, reason: string): Promise<void> {
        const userId = await this.getUserId();
        await fetch(`${API_BASE}/api/v1/games/${gameId}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, reason }),
        });
    },
};
