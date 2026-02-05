# DURRA — TikTok Games Platform

## 🌐 Backend (Laravel)
### Overview
High-performance Laravel backend for an Android-first HTML5 game streaming platform. Optimized for low-latency feed delivery and secure game deployments.

### Architecture
- **API-First**: Designed for mobile consumers.
- **Stateless Feed**: Cursor-based pagination for fluid swipe discovery.
- **Atomic Deployments**: Versioned game storage to prevent caching issues and allow rollbacks.
- **Analytics Pipeline**: Lightweight logging for engagement metrics.

### Tech Stack
- Laravel 11.x
- MySQL 8.0
- PHP 8.2+
- Redis (for Feed Caching & Analytics buffering)

---

## 📱 Mobile App (React Native)

### 🚀 Quick Start
#### Development
```bash
cd ArcadiaApp
npm install
npm start
```
Then press `a` to open on Android emulator or scan QR with Expo Go app.

### 📦 Project Structure
```
ArcadiaApp/
├── App.tsx                    # Entry point
├── src/
│   ├── components/
│   │   ├── GameCard.tsx       # WebView container with lifecycle
│   │   └── ActionRail.tsx     # Like/Share/Restart buttons
│   ├── screens/
│   │   └── GameFeedScreen.tsx # Main vertical feed
│   ├── services/
│   │   └── api.ts             # API + Analytics client
```

### 🛡️ Architecture
- **Trinity Engine**: Only 3 WebViews active at any time (prev, current, next)
- **Haptic Feedback**: Light on swipe, Medium on action buttons
- **Bridge Protocol**: Games communicate via `postMessage` / `CustomEvent`
