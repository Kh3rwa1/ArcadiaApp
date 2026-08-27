import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game, AnalyticsEvent } from '../types';
import { getApiBase } from '../config/environment';

// ═══════════════════════════════════════════════════════════════════════════
// Game Catalog — Curated collection (fallback when server is unavailable)
// ═══════════════════════════════════════════════════════════════════════════

function buildCatalog(): Game[] {
    const API_BASE = getApiBase();
    return [
        { id: 'neon-uuid', title: 'Neon Clicker', description: 'Tap to the rhythm and chase the neon high score!', game_url: `${API_BASE}/games/neon-uuid/v1/index.html`, version: 'v1.2.4', creator: 'DURRA Labs', category: 'Arcade', trending: true, likes: 12847, plays: 45200 },
        { id: 'zen-uuid', title: 'Zen Balancer', description: 'Find your inner peace through the art of balance.', game_url: `${API_BASE}/games/zen-uuid/v1/index.html`, version: 'v2.0.1', creator: 'Mindful Games', category: 'Zen', trending: false, likes: 8234, plays: 28100 },
        { id: 'dot-hunter', title: 'Dot Hunter', description: 'Hunt the dots, collect the points, beat the clock!', game_url: `${API_BASE}/games/dot-hunter/v1/index.html`, version: 'v1.0.0', creator: 'Speed Studios', category: 'Action', trending: true, likes: 6891, plays: 21500 },
        { id: 'color-match', title: 'Color Match', description: 'Test your reflexes in this colorful matching challenge!', game_url: `${API_BASE}/games/color-match/v1/index.html`, version: 'v1.1.0', creator: 'DURRA Labs', category: 'Puzzle', trending: false, likes: 4520, plays: 15800 },
        { id: 'gravity-jump', title: 'Gravity Jump', description: 'Defy gravity and reach new heights!', game_url: `${API_BASE}/games/gravity-jump/v1/index.html`, version: 'v1.0.3', creator: 'Sky High Games', category: 'Endless', trending: true, likes: 9872, plays: 38400 },
        { id: 'math-dash', title: 'Math Dash', description: 'Race against time to solve equations.', game_url: `${API_BASE}/games/math-dash/v1/index.html`, version: 'v1.0.0', creator: 'EduPlay', category: 'Educational', trending: false, likes: 3210, plays: 12100 },
        { id: 'memory-flip', title: 'Memory Flip', description: 'Classic memory game with a modern twist.', game_url: `${API_BASE}/games/memory-flip/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Brain', trending: false, likes: 5640, plays: 19200 },
        { id: 'durra-bird', title: 'DURRA Bird', description: 'Tap to defy gravity in this neon-soaked challenge.', game_url: `${API_BASE}/games/durra-bird/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Action', trending: true, likes: 15400, plays: 89000 },
        { id: 'durra-blocks', title: 'DURRA Blocks', description: 'Minimalist geometry in motion. Stack, clear, evolve.', game_url: `${API_BASE}/games/durra-blocks/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Arcade', trending: true, likes: 12100, plays: 45000 },
        { id: 'neon-nebula', title: 'Neon Nebula', description: 'Stunning particle experience. Tether the light.', game_url: `${API_BASE}/games/neon-nebula/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Zen', trending: true, likes: 9800, plays: 32000 },
        { id: 'nebula-drift', title: 'Nebula Drift', description: 'Navigate through cosmic debris in this space flight.', game_url: `${API_BASE}/games/nebula-drift/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Action', trending: true, likes: 8200, plays: 28000 },
        { id: 'voxel-runner', title: 'Voxel Runner', description: 'Race through a synthwave city. Dodge obstacles.', game_url: `${API_BASE}/games/voxel-runner/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Endless', trending: true, likes: 11500, plays: 42000 },
        { id: 'cyber-golf', title: 'Cyber Golf', description: 'Futuristic mini-golf with gravity wells.', game_url: `${API_BASE}/games/cyber-golf/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Arcade', trending: false, likes: 6800, plays: 19000 },
        { id: 'sphere-quest', title: 'Sphere Quest', description: 'Tilt and roll through marble mazes.', game_url: `${API_BASE}/games/sphere-quest/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Puzzle', trending: false, likes: 5400, plays: 15000 },
        { id: 'neon-knights', title: 'Neon Knights', description: 'Arena survival combat. Defeat waves of enemies.', game_url: `${API_BASE}/games/neon-knights/v1/index.html`, version: 'v1.0.0', creator: 'DURRA Labs', category: 'Action', trending: true, likes: 14200, plays: 51000 },
        { id: 'quantum-racer', title: 'Quantum Racer', description: 'High-speed endless runner through neon corridors.', game_url: `${API_BASE}/games/quantum-racer/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Endless', trending: true, likes: 18500, plays: 72000 },
        { id: 'shadow-striker', title: 'Shadow Striker', description: 'Combat arena action. Defeat enemy waves!', game_url: `${API_BASE}/games/shadow-striker/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Action', trending: true, likes: 16200, plays: 58000 },
        { id: 'neon-drift', title: 'Neon Drift', description: 'Synthwave racing with drift scoring.', game_url: `${API_BASE}/games/neon-drift/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Arcade', trending: true, likes: 15800, plays: 55000 },
        { id: 'crystal-caverns', title: 'Crystal Caverns', description: 'Collect magical crystals in cavernous puzzles.', game_url: `${API_BASE}/games/crystal-caverns/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Puzzle', trending: false, likes: 9400, plays: 32000 },
        { id: 'gravity-shift', title: 'Gravity Shift', description: 'Zero-G platformer. Shift gravity to collect orbs!', game_url: `${API_BASE}/games/gravity-shift/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Puzzle', trending: true, likes: 12100, plays: 41000 },
        { id: 'cyber-siege', title: 'Cyber Siege', description: 'Tower defense with turrets. Protect your base!', game_url: `${API_BASE}/games/cyber-siege/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Strategy', trending: true, likes: 14700, plays: 48000 },
        { id: 'photon-blaster', title: 'Photon Blaster', description: 'Space shooter with auto-fire. Survive!', game_url: `${API_BASE}/games/photon-blaster/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Action', trending: true, likes: 17300, plays: 63000 },
        { id: 'lava-escape', title: 'Lava Escape', description: 'Endless climber with rising lava.', game_url: `${API_BASE}/games/lava-escape/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Endless', trending: true, likes: 13900, plays: 52000 },
        { id: 'circuit-breaker', title: 'Circuit Breaker', description: 'Connection puzzle. Rotate nodes to complete!', game_url: `${API_BASE}/games/circuit-breaker/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Brain', trending: false, likes: 8200, plays: 28000 },
        { id: 'astro-miner', title: 'Astro Miner', description: 'Space mining adventure. Harvest asteroids!', game_url: `${API_BASE}/games/astro-miner/v1/index.html`, version: 'v2.0.0', creator: 'DURRA Labs', category: 'Arcade', trending: false, likes: 10500, plays: 35000 },
    ];
}

function buildQuickHitGames(): Game[] {
    const API_BASE = getApiBase();
    return [
        { id: 'subway-surfers', title: 'Subway Surfers', description: 'Endless runner with fast reflex play.', game_url: `${API_BASE}/games/subway-surfers/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Endless', trending: true, likes: 21400, plays: 88500 },
        { id: 'geometry-dash-world', title: 'Geometry Dash World', description: 'Rhythm-based jumps, tiny levels, huge replay.', game_url: `${API_BASE}/games/geometry-dash-world/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Rhythm', trending: true, likes: 19600, plays: 74200 },
        { id: 'hole-io', title: 'Hole.io', description: 'Eat everything and grow bigger.', game_url: `${API_BASE}/games/hole-io/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Arcade', trending: true, likes: 17700, plays: 68100 },
        { id: 'mob-control', title: 'Mob Control', description: 'Launch crowds and capture bases.', game_url: `${API_BASE}/games/mob-control/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Strategy', trending: true, likes: 16800, plays: 62400 },
        { id: 'snake-clash', title: 'Snake Clash!', description: 'Classic snake with modern twists.', game_url: `${API_BASE}/games/snake-clash/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Arcade', trending: false, likes: 13300, plays: 49000 },
        { id: 'space-shooter-galaxy-attack', title: 'Space Shooter', description: 'Classic shoot-em-up with enemy waves.', game_url: `${API_BASE}/games/space-shooter-galaxy-attack/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Action', trending: true, likes: 18200, plays: 70900 },
        { id: 'galaxiga-arcade', title: 'Galaxiga', description: 'Retro-style shooter wave after wave.', game_url: `${API_BASE}/games/galaxiga-arcade/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Action', trending: true, likes: 17100, plays: 66800 },
        { id: 'rise-up-balloon', title: 'Rise Up', description: 'One-touch control with short survival rounds.', game_url: `${API_BASE}/games/rise-up-balloon/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Casual', trending: false, likes: 12000, plays: 43100 },
        { id: 'bouncemasters-penguin', title: 'Bouncemasters', description: 'Physics yanks and quick distance levels.', game_url: `${API_BASE}/games/bouncemasters-penguin/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Physics', trending: false, likes: 11400, plays: 40200 },
        { id: 'air-force-1945', title: '1945 Air Force', description: 'Fast arcade flying with dense enemy squadrons.', game_url: `${API_BASE}/games/air-force-1945/v1/index.html`, version: 'v1.0.0', creator: 'Arcadia Originals', category: 'Action', trending: true, likes: 18900, plays: 73100 },
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
// API Service
// ═══════════════════════════════════════════════════════════════════════════

let cachedCatalog: Game[] | null = null;

function getLocalCatalog(): Game[] {
    if (!cachedCatalog) {
        cachedCatalog = [...buildCatalog(), ...buildQuickHitGames()];
    }
    return cachedCatalog;
}

export const api = {
    async getFeed(cursor?: string): Promise<Game[]> {
        const API_BASE = getApiBase();
        try {
            const url = cursor
                ? `${API_BASE}/api/v1/feed?cursor=${cursor}`
                : `${API_BASE}/api/v1/feed`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            const json = await response.json();

            if (json.status === 'success') {
                const gamesData = json.data.data || json.data;
                return gamesData.map((game: Record<string, unknown>) => ({
                    ...game,
                    category: game.category || ((game.settings as Record<string, unknown>)?.categories as string[])?.[0] || 'Game',
                    game_url: (game.game_url as string)?.startsWith('/')
                        ? `${API_BASE}${game.game_url}`
                        : game.game_url
                })) as Game[];
            }
            return getLocalCatalog();
        } catch {
            return getLocalCatalog();
        }
    },

    async getGame(id: string): Promise<Game | null> {
        return getLocalCatalog().find(g => g.id === id) || null;
    },

    async trackEvent(event: AnalyticsEvent): Promise<{ status: string; percentile?: number }> {
        const API_BASE = getApiBase();
        try {
            if (event.event_type === 'score_update') {
                const response = await fetch(`${API_BASE}/api/v1/analytics/event`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event),
                });
                return await response.json();
            }

            const events = await this.getQueuedEvents();
            events.push({ ...event, timestamp: Date.now() });
            await AsyncStorage.setItem('analytics_queue', JSON.stringify(events));

            if (events.length >= 5) {
                await this.flushEvents();
            }
            return { status: 'queued' };
        } catch {
            return { status: 'error' };
        }
    },

    async getQueuedEvents(): Promise<Record<string, unknown>[]> {
        try {
            const data = await AsyncStorage.getItem('analytics_queue');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    async flushEvents(): Promise<void> {
        const API_BASE = getApiBase();
        try {
            const events = await this.getQueuedEvents();
            if (events.length === 0) return;

            await fetch(`${API_BASE}/api/v1/analytics/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events }),
            });

            await AsyncStorage.removeItem('analytics_queue');
        } catch {
            // Will retry on next flush
        }
    },

    async getUserId(): Promise<string> {
        let userId = await AsyncStorage.getItem('user_uuid');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
            await AsyncStorage.setItem('user_uuid', userId);
        }
        return userId;
    },

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
            return { likedGames: [], bookmarkedGames: [], followedCreators: [] };
        }
    },

    async saveUserPreferences(prefs: {
        likedGames: string[];
        bookmarkedGames: string[];
        followedCreators: string[];
    }): Promise<void> {
        await AsyncStorage.setItem('user_preferences', JSON.stringify(prefs));
    },

    async reportGame(gameId: string, reason: string): Promise<void> {
        const API_BASE = getApiBase();
        const userId = await this.getUserId();
        await fetch(`${API_BASE}/api/v1/games/${gameId}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, reason }),
        });
    },
};
