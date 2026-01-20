# Arcadia Mobile: Screen Architecture & Performance Rules

## 🏛️ Component Architecture
- **Feed Engine (`FlatList`)**: Uses `windowSize={3}` and `pagingEnabled` to simulate the TikTok swipe experience. Core logic relies on `onViewableItemsChanged` to manage game state transitions.
- **Isolated WebView Context**: Each `GameCard` is a memoized component. It remains "dead" (placeholder) until it becomes one of the 3 active indices (Prev, Current, Next).
- **Communication Bridge**: Uses `injectJavaScript` to signal `play`/`pause`/`mute` to the HTML5 game engine (Phaser/Unity WebGL/Three.js).

## ⚡ WebView Lifecycle & Preloading
| State | Action | Detail |
| :--- | :--- | :--- |
| **Active (n)** | `play` + `unmute` | Game is interactive and audible. High-priority CPU/GPU. |
| **Next (n+1)** | `preload` | WebView loads URL in background. `mute` and `pause` signals sent. |
| **Prev (n-1)** | `cache` | Game state preserved but paused. Immediate resume on back-swipe. |
| **Out of View** | `unmount` | WebView instance destroyed to free RAM for the next preload. |

## 🎮 Performance Rules (Android-First)
1. **GPU Acceleration**: `androidLayerType="hardware"` enabled on WebViews to ensure 60FPS for WebGL content.
2. **Zero Clipping**: `removeClippedSubviews={true}` ensures React Native doesn't draw items outside the viewport.
3. **Memory Cap**: Fixed limit of 3 active `WebView` instances. Android's Chromium process handles each, so capping is vital to prevent OOM (Out Of Memory) crashes.
4. **Haptics**: `impactLight` on card transition; `impactMedium` on "Like" or "Restart" to provide tactile confirmation of high-immersion actions.

## 🎨 UI & UX Logic
- **Action Rail**: Floating absolute positioned column on the right. High contrast but translucent background.
- **Bottom Gradient**: Linear gradient `(rgba(0,0,0,0) -> rgba(0,0,0,0.8))` to ensure text readability over variable game backgrounds.
- **Gesture Handling**: Native vertical scroll for feed navigation. The WebView consumes internal gestures (taps/drags) while the `FlatList` interceptor handles swipes.
