# Agents — DURRA (Arcadia)

## Build & Run
- `npx expo start` — Start dev server
- `npx expo start --ios` — Run on iOS
- `npx expo start --android` — Run on Android
- `npx expo start --web` — Run on web
- `node server/game-server.js` — Start game server (port 3001)
- `php artisan serve` — Start Laravel backend (port 8000, from laravel-backend/)

## Type Check
- `npx tsc --noEmit` — Run TypeScript type checking

## Lint
- `npx eslint src/` — Run ESLint
- `npx prettier --check src/` — Check formatting

## Test
- `npx jest` — Run tests
- `npx jest --coverage` — Run tests with coverage

## Architecture
- React Native + Expo managed workflow
- TypeScript throughout
- React Navigation for tab-based navigation (GameFeed, Discover, Library, Settings)
- Dual backend: Node/Express (port 3001) + Laravel (port 8000)
- All config in `src/config/environment.ts`
- Shared constants in `src/constants/`
- Custom hooks in `src/hooks/`
- Game bridge protocol for WebView communication

## Code Style
- 2-space indentation
- Single quotes
- Trailing commas
- 120 char line width
- TypeScript strict mode
- Functional components only (no class components except ErrorBoundary)
- All screen components default export
- All hooks prefixed with `use`
