# DURRA Game Server

Express server for serving HTML5 game files.

## Quick Start
```bash
npm install
npm start
```

## Environment Variables
- `PORT` — Server port (default: 3001)
- `DURRA_ADMIN_KEY` — Admin API key for upload endpoints
- `CORS_ORIGINS` — Comma-separated allowed origins

## API Endpoints
- `GET /api/health-check` — Health check
- `GET /api/v1/feed` — Game feed (shuffled)
- `GET /api/games` — List all games
- `GET /api/v1/games/:id/stats` — Game stats
- `POST /api/games/upload` — Upload game ZIP (admin only)
- `GET /api/admin/games` — Admin game list (admin only)
