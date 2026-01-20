# Arcadia — React Native App

## 🚀 Quick Start

### Development
```bash
cd ArcadiaApp
npm install
npm start
```

Then press `a` to open on Android emulator or scan QR with Expo Go app.

### Build APK (for testing)
```bash
npx eas-cli build --platform android --profile preview
```

### Build AAB (for Play Store)
```bash
npx eas-cli build --platform android --profile production
```

## 📦 Project Structure
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
│   └── types/
│       └── index.ts           # TypeScript interfaces
├── assets/                    # Icons, splash
├── app.json                   # Expo config
└── eas.json                   # Build config
```

## 🛡️ Architecture
- **Trinity Engine**: Only 3 WebViews active at any time (prev, current, next)
- **Haptic Feedback**: Light on swipe, Medium on action buttons
- **Bridge Protocol**: Games communicate via `postMessage` / `CustomEvent`
- **Analytics**: Impression tracking on every game view

## 📱 Play Store Checklist
- [ ] Build signed AAB
- [ ] Create Play Console account ($25)
- [ ] Upload app icon (512x512)
- [ ] Create feature graphic (1024x500)
- [ ] Add 4+ screenshots
- [ ] Write privacy policy
- [ ] Complete content rating
- [ ] Submit for review
