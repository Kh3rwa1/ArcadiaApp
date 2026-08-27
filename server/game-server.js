const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT || 3001;
const GAMES_DIR = path.join(__dirname, '..', 'public', 'games');
const ADMIN_KEY = process.env.DURRA_ADMIN_KEY || '';

if (!ADMIN_KEY) {
    console.warn('⚠️  DURRA_ADMIN_KEY not set — admin endpoints are disabled');
}

// ═══════════════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════════════

app.use(express.json());

// CORS — only allow specific origins
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:8081,http://localhost:19006').split(',');
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-DURRA-Admin-Key');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Rate limiting (simple in-memory)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

function rateLimiter(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    if (!rateLimit.has(ip)) rateLimit.set(ip, []);
    const timestamps = rateLimit.get(ip).filter(t => t > windowStart);
    rateLimit.set(ip, timestamps);

    if (timestamps.length >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    timestamps.push(now);
    next();
}

// Cleanup rate limit map periodically
setInterval(() => {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW * 2;
    for (const [ip, timestamps] of rateLimit) {
        const valid = timestamps.filter(t => t > cutoff);
        if (valid.length === 0) rateLimit.delete(ip);
        else rateLimit.set(ip, valid);
    }
}, 60_000);

// Admin auth middleware
function requireAdmin(req, res, next) {
    if (!ADMIN_KEY) {
        return res.status(503).json({ error: 'Admin not configured (set DURRA_ADMIN_KEY)' });
    }
    const key = req.headers['x-durra-admin-key'] || req.query.key;
    if (key !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Serve static game files
app.use('/games', express.static(GAMES_DIR, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    },
}));

// Multer for ZIP uploads
const upload = multer({
    dest: path.join(__dirname, 'tmp'),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only ZIP files allowed'));
        }
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function slugify(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64); // Limit slug length
}

function parseGameTitle(gameDir) {
    const indexPath = path.join(GAMES_DIR, gameDir, 'v1', 'index.html');
    if (fs.existsSync(indexPath)) {
        try {
            const html = fs.readFileSync(indexPath, 'utf-8');
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1].trim()) {
                return titleMatch[1].trim().slice(0, 100); // Limit title length
            }
        } catch { /* ignore read errors */ }
    }
    return gameDir
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function guessCategory(title, dirName) {
    const lower = (title + ' ' + dirName).toLowerCase();
    if (/puzzle|match|memory|circuit|crystal/.test(lower)) return 'Puzzle';
    if (/race|drift|runner|racer|dash/.test(lower)) return 'Endless';
    if (/shoot|blast|strike|knight|siege|combat|assault/.test(lower)) return 'Action';
    if (/zen|nebula|balanc/.test(lower)) return 'Zen';
    if (/math|edu/.test(lower)) return 'Educational';
    if (/brain|flip/.test(lower)) return 'Brain';
    if (/strategy|tower|defend/.test(lower)) return 'Strategy';
    return 'Arcade';
}

function validateSlug(slug) {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 64;
}

function validateVersion(version) {
    return /^v\d+$/.test(version) && version.length <= 8;
}

function scanGames() {
    if (!fs.existsSync(GAMES_DIR)) return [];

    const dirs = fs.readdirSync(GAMES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'));

    const games = [];
    for (const dir of dirs) {
        const versionDirs = [];
        try {
            const children = fs.readdirSync(path.join(GAMES_DIR, dir.name), { withFileTypes: true });
            for (const child of children) {
                if (child.isDirectory() && /^v\d+/.test(child.name)) {
                    const indexPath = path.join(GAMES_DIR, dir.name, child.name, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        versionDirs.push(child.name);
                    }
                }
            }
        } catch { continue; }

        if (versionDirs.length === 0) continue;

        versionDirs.sort((a, b) => {
            const numA = parseInt(a.replace('v', ''));
            const numB = parseInt(b.replace('v', ''));
            return numB - numA;
        });
        const latestVersion = versionDirs[0];

        const title = parseGameTitle(dir.name);
        const category = guessCategory(title, dir.name);

        games.push({
            id: dir.name,
            title,
            description: `Play ${title} — an interactive HTML5 experience.`,
            game_url: `/games/${dir.name}/${latestVersion}/index.html`,
            version: latestVersion,
            creator: 'Arcadia Labs',
            category,
            trending: Math.random() > 0.5,
            likes: Math.floor(Math.random() * 15000) + 1000,
            plays: Math.floor(Math.random() * 50000) + 5000,
            status: 'live',
        });
    }

    return games.sort((a, b) => a.title.localeCompare(b.title));
}

// ═══════════════════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════════════════

// Health check
app.get('/api/health-check', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), games: scanGames().length });
});

// List all games
app.get('/api/games', rateLimiter, (req, res) => {
    const games = scanGames();
    res.json({ status: 'success', data: games, total: games.length });
});

// Feed endpoint (mobile app compatibility)
app.get('/api/v1/feed', rateLimiter, (req, res) => {
    const games = scanGames();
    const shuffled = [...games].sort(() => Math.random() - 0.5);
    res.json({
        status: 'success',
        data: {
            data: shuffled,
            next_cursor: null,
        }
    });
});

// Game stats endpoint
app.get('/api/v1/games/:id/stats', rateLimiter, (req, res) => {
    const gameDir = path.join(GAMES_DIR, req.params.id);
    if (!fs.existsSync(gameDir)) {
        return res.status(404).json({ error: 'Game not found' });
    }
    res.json({
        status: 'success',
        data: {
            likes: Math.floor(Math.random() * 15000) + 1000,
            plays: Math.floor(Math.random() * 50000) + 5000,
        }
    });
});

// Upload handler (admin only)
async function handleGameUpload(req, res) {
    try {
        const { title, category, version_tag } = req.body;
        if (!title) return res.status(400).json({ message: 'Title is required' });
        if (!req.file) return res.status(400).json({ message: 'ZIP file is required' });

        const slug = slugify(title);
        if (!validateSlug(slug)) {
            return res.status(400).json({ message: 'Invalid game title (must be alphanumeric with hyphens)' });
        }

        const version = version_tag || 'v1';
        if (!validateVersion(version)) {
            return res.status(400).json({ message: 'Invalid version (must be v1, v2, etc.)' });
        }

        const destDir = path.join(GAMES_DIR, slug, version);

        // Create destination
        fs.mkdirSync(destDir, { recursive: true });

        // Extract ZIP using unzip (no shell injection possible with execFile)
        try {
            await execFileAsync('unzip', ['-o', req.file.path, '-d', destDir]);
        } catch {
            fs.rmSync(path.join(GAMES_DIR, slug), { recursive: true, force: true });
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Failed to extract ZIP file' });
        }

        // Verify index.html exists
        const indexPath = path.join(destDir, 'index.html');
        if (!fs.existsSync(indexPath)) {
            const entries = fs.readdirSync(destDir, { withFileTypes: true });
            const subDir = entries.find(e => e.isDirectory() && !e.name.startsWith('.'));
            if (subDir && fs.existsSync(path.join(destDir, subDir.name, 'index.html'))) {
                const subPath = path.join(destDir, subDir.name);
                const subEntries = fs.readdirSync(subPath);
                for (const entry of subEntries) {
                    fs.renameSync(path.join(subPath, entry), path.join(destDir, entry));
                }
                fs.rmdirSync(subPath);
            } else {
                fs.rmSync(path.join(GAMES_DIR, slug), { recursive: true, force: true });
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ message: 'No index.html found in ZIP root' });
            }
        }

        fs.unlinkSync(req.file.path);

        console.log(`✅ Deployed: ${title} → /games/${slug}/${version}/`);

        res.json({
            status: 'success',
            game: {
                id: slug,
                title,
                category: category || 'Arcade',
                game_url: `/games/${slug}/${version}/index.html`,
                version,
            }
        });
    } catch (err) {
        console.error('Upload error:', err);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Upload failed' });
    }
}

// Upload routes (admin only)
app.post('/api/games/upload', requireAdmin, upload.single('game_zip'), handleGameUpload);
app.post('/api/admin/games/upload', requireAdmin, upload.single('game_zip'), handleGameUpload);

// Admin game list (admin only)
app.get('/api/admin/games', requireAdmin, (req, res) => {
    const games = scanGames().map(g => ({
        id: g.id,
        title: g.title,
        type: 'game',
        status: g.status,
        sessions: g.plays.toLocaleString(),
        retention: '+0%',
        avgTime: '0:00',
        version: g.version,
        url: g.game_url,
        config: {},
    }));
    res.json({ status: 'success', data: games });
});

// Admin: Config update (admin only)
app.patch('/api/admin/games/:id/config', requireAdmin, express.json(), (req, res) => {
    console.log(`📝 Config update for ${req.params.id}:`, req.body);
    res.json({ status: 'success', config: req.body.config || {} });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ═══════════════════════════════════════════════════════════════════════════
// Start
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
    const games = scanGames();
    console.log(`
╔══════════════════════════════════════════════╗
║   🎮 DURRA Game Server                      ║
║   Port: ${String(PORT).padEnd(37)}║
║   Games: ${String(games.length).padEnd(3)} loaded from public/games/     ║
║                                              ║
║   Admin:  http://localhost:${PORT}/api/admin/games ║
║   Feed:   http://localhost:${PORT}/api/v1/feed     ║
║   Health: http://localhost:${PORT}/api/health-check ║
╚══════════════════════════════════════════════╝
`);
});
