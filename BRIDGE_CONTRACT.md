# Arcadia Experience Bridge Protocol (v1.1)

## 🏗️ Philosophy
- **Host is Master**: The mini-app is a guest and must respond to lifecycle signals.
- **Unidirectional Data Flow**: State updates follow a strict `action` + `payload` JSON schema.
- **Fail-Safe**: If an experience doesn't report `READY` within 5 seconds, the app displays a "Unresponsive" overlay.

---

## 🛰️ Message Schema
All communication happens via `window.ReactNativeWebView.postMessage` (Mini-App -> Host) and `window.dispatchEvent` (Host -> Mini-App).

### Standard Wrapper
```json
{
  "version": "1.0",
  "type": "LIFECYCLE | GAMEPLAY | EVENT",
  "action": "STRING",
  "payload": {}
}
```

---

## 📲 1. Host → Mini-App (Injected via `injectJavaScript`)

| Action | Payload | Description |
| :--- | :--- | :--- |
| `LIFECYCLE_PAUSE` | `{}` | Stop internal loops, freeze animations, stop audio. |
| `LIFECYCLE_RESUME` | `{}` | Resume normal operations and audio. |
| `AUDIO_CONTROL` | `{"muted": boolean, "volume": 0.0-1.0}` | Global volume control. |
| `APP_CONFIG_UPDATE` | `{"config": object}` | Push remote configuration updates. |
| `UX_HAPTIC` | `{"type": "impactLight|impactMedium|impactHeavy|notificationSuccess|notificationWarning|notificationError"}` | Trigger device haptics. |
| `APP_RESTART` | `{}` | Reset experience state. |

---

## 🎮 2. Mini-App → Host (Sent via `postMessage`)

| Action | Payload | Requirement |
| :--- | :--- | :--- |
| `HEARTBEAT_READY` | `{"type": "game|utility|tool|social", "engine": "phaser|react|vue|..."}` | **Critical.** Sent after assets load. |
| `FLOW_START` | `{}` | Sent when user starts the primary interaction. |
| `STATE_UPDATE` | `{"key": string, "value": any}` | Update host about persistence-worthy state. |
| `FLOW_COMPLETE` | `{"result": any, "status": "success|fail"}` | Triggers post-experience workflow. |
| `ERROR_REPORT` | `{"message": string}` | For internal logging. |

---

## 🛡️ Security & Sandboxing (WebView Config)
To prevent "hostile" games from breaking the app, the following constraints are enforced:

1. **CSP (Content Security Policy)**: 
   `default-src 'self' 'unsafe-inline'; connect-src 'self' https://api.arcadia.com;`
   *Prevents games from exfiltrating data to unknown servers.*
2. **Feature Policy**:
   `allow="autoplay; muted; haptics;"`
   *Explicitly blocks camera, microphone, and geolocation.*
3. **Navigation Interception**:
   `onShouldStartLoadWithRequest` in React Native returns `false` for all URLs not matching your `games.cdn.com` domain. *No external links allowed.*

---

## 🧪 Example Payloads

### Game reporting completion
```json
window.ReactNativeWebView.postMessage(JSON.stringify({
  "version": "1.0",
  "type": "GAMEPLAY",
  "action": "GAME_COMPLETE",
  "payload": {
    "points": 1250,
    "status": "win",
    "metadata": { "level": 5 }
  }
}));
```

### App muting the game on swipe
```javascript
window.dispatchEvent(new CustomEvent('ArcadiaBridge', { 
  detail: { 
    type: "LIFECYCLE",
    action: "AUDIO_CONTROL", 
    payload: { "muted": true } 
  } 
}));
```

---

## ⚠️ Failure Handling
1. **Z-Index Hijacking**: Games are forced to `overflow: hidden` on the body via injected CSS.
2. **Infinite Loops**: The App monitors WebView CPU usage (Android Performance API). If usage $> 90\%$ for 3 seconds without user interaction, the instance is terminated.
3. **Ghost Audio**: If a game continues playing audio after `LIFECYCLE_PAUSE`, the App forces `muted=true` via the WebView's Android Media Controller.
