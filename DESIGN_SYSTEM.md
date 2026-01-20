# Arcadia Visual & Motion System: "Inevitable Excellence"

## 🎨 Color System (The Obsidian Palette)
A system built on depth, not flatness. We use layers of dark grays to create hierarchy, reserving the primary accent only for meaningful status changes.

- **Void Black**: `#000000` (Surface level 0 - Fullscreen Game background)
- **Obsidian**: `#040405` (Surface level 1 - Nav components)
- **Slate**: `#0D0D10` (Surface level 2 - Cards, Overlays)
- **Border**: `#1C1C21` (Subtle separation)
- **Primary Accent**: `#3B82F6` (Electric Cobalt - Interactive states only)
- **Text Primary**: `#F9FAFB` (High contrast)
- **Text Secondary**: `#9CA3AF` (De-emphasized metadata)

---

## 📐 Layout & Spacing
A strict **8pt Grid** ensures optical harmony and predictability.

- **Touch Targets**: Minimum `48pt x 48pt` or `56pt` height for primary buttons.
- **Corner Radii**: 
  - Buttons: `12pt` (Soft but precise)
  - Cards: `24pt` (Modern, organic)
  - Modal/Sheets: `32pt` (Premium immersion)
- **Safe Zones**: `24pt` horizontal gutters for all content.

---

## ✒️ Typography Scale (Inter)
| Level | Size/Line | Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Display Large** | 40/48 | 700 | Hero game titles |
| **Headline Medium** | 24/32 | 600 | Section headers |
| **Body Large** | 16/24 | 400 | Descriptions, primary text |
| **Label Small** | 12/16 | 600 | Badges, small metadata |

---

## 🎬 Motion Timing Rules
Motion in Arcadia is **inertial and calm**. We use a "Weight and Friction" approach.

### 1. The "Arcadia Curve"
All transitions use a custom Cubic Bezier for an "inevitable" feeling:
`bezier(0.2, 0, 0, 1)` — Immediate start, long intentional decay.

### 2. Standard Timings
- **Micro-interactions (Hover, Click)**: `150ms`. Feels instantaneous but not telepathic.
- **Page Transitions (Swipe)**: `400ms`. Allows the eye to track the movement without waiting.
- **Modal Entrances**: `300ms` with a subtle scale-up from 0.95 to 1.0.

### 3. Component Behavior
- **Active State**: Deepen the background color and add a `2pt` inner glow of the accent color.
- **Haptic Link**: Every primary button click triggers a `light` haptic feedback (`impactLight`).
- **Surface Elevation**: Avoid drop shadows. Use border luminance or background-color shifts to indicate depth.

---

## 🚫 Anti-Patterns (Avoid at all costs)
- **Generic Red/Blue/Green**: No system defaults. Colors must be tailored to the Obsidian palette.
- **Springy/Bouncy Animation**: Avoid oversaturated "juice." It feels childish. Stick to the inertial decay curve.
- **Centered Text Over Graphics**: Always use a deep gradient overlay (Obsidian -> Transparent) behind text to ensure legibility without "boxed" UI components.
- **UI Flutter**: Do not show loading spinners. Use skeleton gradients that shimmer at exactly `1.5s` frequency.
