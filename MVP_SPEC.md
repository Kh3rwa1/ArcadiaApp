# Arcadia MVP: The "Pure Flow" Specification

## 🎯 The Core Loop
**Swipe → 400ms Load → Play → Repeat.** 
Everything else is noise. If a feature doesn't make the transition between games faster or the discovery more accurate, it is deleted.

---

## ✅ MVP Feature List (The "Only" List)
1.  **High-Fidelity Feed Engine**: Native-grade vertical scroll with inertial decay.
2.  **The Predictive Trinity**: 3-WebView lifecycle (Prev, Current, Next) for zero perceived loading.
3.  **Implicit Personalization**: Anonymous tracking of `play_duration` to re-rank the feed for that specific device. No login required.
4.  **Admin ZIP Pipeline**: A single internal endpoint to drop a ZIP and see it live for testing.
5.  **Physical Controls**: "Restart" and "Mute" buttons. Reliability over fluff.

---

## 🚫 Explicit Non-Features (The "Not Now" List)
1.  **Accounts & Auth**: No "Sign Up" wall. Users are identified by device UUID. Friction is the enemy of retention.
2.  **Social Layer**: No comments, no following, no chat. Gaming is the social act; the UI should stay out of the way.
3.  **Monetization**: No ads, no IAPs. Retention is the only metric that matters in Day 0.
4.  **Leaderboards**: Competitive play is a stage-two feature. MVP is about casual discovery.
5.  **Search**: Browsing is better than searching. If the algorithm is good, search is a failure of discovery.

---

## 🗓️ Roadmap: Later vs. Never

### build Later (Post-Retention Proof)
- **Deep-Link Sharing**: Send a single game to a friend via a URL.
- **Global High Scores**: Minimalist, non-intrusive overlays for competitive mechanics.
- **Haptic Design 2.0**: Specialized vibration patterns for different game genres.

### build Never (Purely Prohibited)
- **Video Content**: We are not TikTok. We are the evolution of the Arcade.
- **Banners/Interstitials**: We will never break the flow. Our value is in the continuity.
- **Community Forums**: We build products, not playgrounds. Let external platforms handle the chatter.

---

## ⚡ Performance Mandate
- **Boot time**: Under 1.5 seconds to first interactive game.
- **Swipe latency**: Under 16ms to begin motion.
- **Memory footprint**: Strictly capped at 3 WebView instances.
