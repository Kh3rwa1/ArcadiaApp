# DURRA Experience Bridge Protocol (v1.2)

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
  "version": "1.2",
  "type": "LIFECYCLE | GAMEPLAY | EVENT | UX",
  "action": "STRING",
  "payload": {}
}
```

---

## 📲 1. Host → Mini-App (Injected / Dispatched)
The Host dispatches `CustomEvent('DURRA_Bridge', { detail: { action, payload } })` to the `window`.

| Action | Payload | Description |
| :--- | :--- | :--- |
| `LIFECYCLE_PAUSE` | `{}` | Stop internal loops, freeze animations, stop audio. |
| `LIFECYCLE_RESUME` | `{}` | Resume normal operations and audio. |
| `AUDIO_CONTROL` | `{"muted": boolean, "volume": 0.0-1.0}` | Global volume control. |
| `APP_CONFIG_UPDATE` | `{"config": object}` | Push remote configuration updates. |
| `UX_HAPTIC` | `{"type": "impactLight|impactMedium|..."}` | Trigger device haptics (Host side). |
| `APP_RESTART` | `{}` | Reset experience state. |

---

## 🎮 2. Mini-App → Host (Sent via `postMessage`)
Use the `DURRA_Bridge` SDK or send raw JSON.

| Action | Payload | Requirement |
| :--- | :--- | :--- |
| `HEARTBEAT_READY` | `{"type": "game", "engine": "canvas|react|..."}` | **Critical.** Sent after assets load. |
| `FLOW_START` | `{}` | Sent when user starts primary interaction. |
| `STATE_UPDATE` | `{"key": string, "value": any}` | Update host about persistence state. |
| `FLOW_COMPLETE` | `{"result": any, "status": "success|fail"}` | Triggers post-experience workflow. |
| `UX_HAPTIC` | `{"type": "impactLight|..."}` | Request haptics from host. |

---

## 🧪 Example Payloads (SDK)

```javascript
// Game reporting completion
DURRA_Bridge.complete({
  points: 1250,
  status: "win"
});

// Requesting haptic feedback
DURRA_Bridge.haptic('impactMedium');
```

---

## 🛡️ Security & Sandboxing
Enforced via WebView Configuration:

1. **CSP**: `default-src 'self' 'unsafe-inline'; connect-src 'self' https://api.durra.io;`
2. **Feature Policy**: `allow="autoplay; muted; haptics;"`

---

## ⚠️ Failure Handling
1. **Ghost Audio**: If audio survives `LIFECYCLE_PAUSE`, the host forces `muted=true`.
2. **Infinite Loops**: Instances exceeding 90% CPU for 3s without interaction are terminated.
