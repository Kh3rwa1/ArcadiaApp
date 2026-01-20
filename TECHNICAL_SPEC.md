# Arcadia $200B Project Upgrade Specification
**Principal Engineer / Product Designer Post-MVP Upgrade**

## 1. Architecture Diagram
```mermaid
graph TD
    A[Android App / React Native] -- "exp://c/{id}/{s}/{v}" --> B[Deep Link Resolver]
    B --> C[Feed Engine (3-WebView Virt)]
    C -- "Bridge: SCORE/READY" --> D[Analytics/Score Middleware]
    D -- "POST /events" --> E[Laravel API Layer]
    E --> F[(MySQL Database)]
    G[Admin Panel] -- "Upload ZIP/Rollback" --> E
    E -- "Compute Quantiles" --> F
    E -- "Storage Flow" --> H[Local/S3 Game Storage]
    A -- "GET /feed" --> E
```

## 2. API Contract (Key Endpoints)

| Endpoint | Method | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/feed` | GET | `cursor={id}&daily=1` | Returns list of games with health-verified versions. |
| `/api/challenges/{uuid}` | GET | - | Returns metadata for a specific challenge. |
| `/api/scores/rank` | POST | `game_id, score` | Returns "You're better than X% of players". |
| `/api/admin/deploy` | POST | `FormData (zip)` | Robust ZIP validation & atomic extraction. |
| `/api/admin/rollback`| POST | `game_id, version_id`| Instant symlink swap for zero-downtime rollback. |

## 3. Mobile App Implementation detail
### A. 3-WebView Virtualization Engine
The `GameFeedScreen` will manage an array of 3 `PlayableContainer` components.
- **Index Management**: `[activeIndex - 1, activeIndex, activeIndex + 1]` are the only ones kept in memory.
- **Lifecycle Events**:
  - `onMount`: Injected script sets `window.ARCADIA_READY = true`.
  - `onFocus`: Calls `postMessage({type: 'RESUME'})` and unmutes CSS audio.
  - `onBlur`: Calls `postMessage({type: 'PAUSE'})` and mutes.
  - `onDestroy`: Kills the WebView instance to free RAM/GPU.

### B. Bridge Message Schema
| Message | Origin | Action |
| :--- | :--- | :--- |
| `READY` | Game | App hides skeleton overlay, shows UI rail. |
| `SCORE` | Game | App tracks real-time points for "Challenge" generation. |
| `GAME_OVER` | Game | App triggers "Top X%" computation and retry sheet. |
| `HAPTIC` | Game | triggers `Haptics.impactAsync()` on device. |

## 4. Admin Panel Upgrades
- **Health Dashboard**: Red/Green status indicator per version based on crash logs.
- **Atomic Deployments**: Extract to `random_id` folder, change `current` symlink only after success.
- **Quantile Tuning**: Admin can view score distribution curves and adjust "difficulty" flags.

## 5. Design System v2.0 (Obsidian Edge)
- **Spacing**: 4px base (8/16/24/32/48/64 scale).
- **Curve**: `cubic-bezier(0.2, 0, 0, 1)`.
- **Skeleton**: Linear pulse `#1A1A1A` -> `#2A2A2A`.
- **Gloss**: `backdrop-filter: blur(20px) saturate(180%)`.

## 6. Implementation Roadmap

### Phase 1: Core Performance (Days 1-7)
- Implement 3-WebView virtualization.
- Create ZIP sanitization pipeline in Laravel.
- Setup `READY` bridge and skeleton overlays.

### Phase 2: Viral Mechanics (Days 8-14)
- Challenge deep-linking and seed passing.
- Post-game percentile calculations.
- Share card generation (Canvas-based).

### Phase 3: Reliability & Scale (Days 15-21)
- Health-based auto-rollback system.
- Offline grace mode (Service Worker + LocalStorage).
- CDN-ready asset pathing refactor.
