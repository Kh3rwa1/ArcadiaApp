import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as baseColors } from '../theme';

// ═══════════════════════════════════════════════════════════════════
// Theme Presets — 28 color palettes users can choose from
// ═══════════════════════════════════════════════════════════════════

export type ThemeId =
  | 'midnight' | 'abyss' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'slate' | 'snow'
  | 'cherry' | 'cyberpunk' | 'bubblegum' | 'hacker' | 'sakura' | 'amber'
  | 'arctic' | 'dracula' | 'mocha' | 'neon' | 'coral' | 'emerald'
  | 'retro' | 'galaxy' | 'mint' | 'rosegold' | 'electric' | 'crimson'
  | 'tropical' | 'charcoal';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  void: string;
  cosmic: string;
  obsidian: string;
  slate: string;
  surface: string;
  elevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  borderSubtle: string;
  borderDim: string;
  borderBright: string;
  glass: string;
  glassMedium: string;
  glassBright: string;
  isLight: boolean;
  preview: readonly [string, string];
}

// Helper to build a dark theme quickly
const dark = (bg: string, mid: string, hi: string, tint: [number,number,number]): Pick<ThemePreset,
  'textPrimary'|'textSecondary'|'textTertiary'|'textDisabled'|
  'borderSubtle'|'borderDim'|'borderBright'|'glass'|'glassMedium'|'glassBright'|'isLight'> => ({
  textPrimary: '#FFFFFF', textSecondary: `rgba(255,255,255,0.65)`,
  textTertiary: `rgba(255,255,255,0.4)`, textDisabled: `rgba(255,255,255,0.2)`,
  borderSubtle: `rgba(${tint[0]},${tint[1]},${tint[2]},0.08)`,
  borderDim: `rgba(${tint[0]},${tint[1]},${tint[2]},0.12)`,
  borderBright: `rgba(${tint[0]},${tint[1]},${tint[2]},0.2)`,
  glass: `rgba(${tint[0]},${tint[1]},${tint[2]},0.04)`,
  glassMedium: `rgba(${tint[0]},${tint[1]},${tint[2]},0.08)`,
  glassBright: `rgba(${tint[0]},${tint[1]},${tint[2]},0.12)`,
  isLight: false,
});

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  // ── ORIGINAL 8 ────────────────────────────────────────────────
  midnight: {
    id: 'midnight', name: 'Midnight', emoji: '🌑', description: 'Pure dark',
    void: '#000000', cosmic: '#030304', obsidian: '#060608', slate: '#0c0c0f',
    surface: '#121216', elevated: '#1a1a20',
    ...dark('#000','#0c0c0f','#1a1a20',[255,255,255]),
    preview: ['#000000', '#121216'],
  },
  abyss: {
    id: 'abyss', name: 'Deep Abyss', emoji: '🌊', description: 'Dark navy',
    void: '#020617', cosmic: '#0f172a', obsidian: '#0f172a', slate: '#1e293b',
    surface: '#1e293b', elevated: '#334155',
    ...dark('#020617','#1e293b','#334155',[148,163,184]),
    preview: ['#020617', '#1e293b'],
  },
  ocean: {
    id: 'ocean', name: 'Deep Ocean', emoji: '🐋', description: 'Teal depths',
    void: '#042f2e', cosmic: '#064e3b', obsidian: '#064e3b', slate: '#065f46',
    surface: '#047857', elevated: '#059669',
    textPrimary: '#ecfdf5', textSecondary: 'rgba(236,253,245,0.7)',
    textTertiary: 'rgba(236,253,245,0.45)', textDisabled: 'rgba(236,253,245,0.2)',
    borderSubtle: 'rgba(167,243,208,0.08)', borderDim: 'rgba(167,243,208,0.12)',
    borderBright: 'rgba(167,243,208,0.2)',
    glass: 'rgba(167,243,208,0.05)', glassMedium: 'rgba(167,243,208,0.08)',
    glassBright: 'rgba(167,243,208,0.12)',
    isLight: false, preview: ['#042f2e', '#047857'],
  },
  forest: {
    id: 'forest', name: 'Forest', emoji: '🌲', description: 'Dark green',
    void: '#052e16', cosmic: '#14532d', obsidian: '#14532d', slate: '#166534',
    surface: '#15803d', elevated: '#16a34a',
    textPrimary: '#f0fdf4', textSecondary: 'rgba(240,253,244,0.7)',
    textTertiary: 'rgba(240,253,244,0.45)', textDisabled: 'rgba(240,253,244,0.2)',
    borderSubtle: 'rgba(187,247,208,0.08)', borderDim: 'rgba(187,247,208,0.12)',
    borderBright: 'rgba(187,247,208,0.2)',
    glass: 'rgba(187,247,208,0.05)', glassMedium: 'rgba(187,247,208,0.08)',
    glassBright: 'rgba(187,247,208,0.12)',
    isLight: false, preview: ['#052e16', '#15803d'],
  },
  sunset: {
    id: 'sunset', name: 'Sunset', emoji: '🌅', description: 'Warm earth',
    void: '#1c1917', cosmic: '#292524', obsidian: '#292524', slate: '#44403c',
    surface: '#57534e', elevated: '#78716c',
    ...dark('#1c1917','#57534e','#78716c',[214,211,209]),
    preview: ['#1c1917', '#57534e'],
  },
  lavender: {
    id: 'lavender', name: 'Lavender', emoji: '💜', description: 'Soft purple',
    void: '#1e1b4b', cosmic: '#312e81', obsidian: '#312e81', slate: '#3730a3',
    surface: '#4338ca', elevated: '#4f46e5',
    textPrimary: '#eef2ff', textSecondary: 'rgba(238,242,255,0.7)',
    textTertiary: 'rgba(238,242,255,0.45)', textDisabled: 'rgba(238,242,255,0.2)',
    borderSubtle: 'rgba(199,210,254,0.08)', borderDim: 'rgba(199,210,254,0.12)',
    borderBright: 'rgba(199,210,254,0.2)',
    glass: 'rgba(199,210,254,0.05)', glassMedium: 'rgba(199,210,254,0.08)',
    glassBright: 'rgba(199,210,254,0.12)',
    isLight: false, preview: ['#1e1b4b', '#4338ca'],
  },
  slate: {
    id: 'slate', name: 'Steel', emoji: '⚙️', description: 'Neutral gray',
    void: '#18181b', cosmic: '#27272a', obsidian: '#27272a', slate: '#3f3f46',
    surface: '#52525b', elevated: '#71717a',
    ...dark('#18181b','#52525b','#71717a',[161,161,170]),
    preview: ['#18181b', '#52525b'],
  },
  snow: {
    id: 'snow', name: 'Snow', emoji: '☀️', description: 'Light mode',
    void: '#f8fafc', cosmic: '#f1f5f9', obsidian: '#e2e8f0', slate: '#cbd5e1',
    surface: '#f8fafc', elevated: '#ffffff',
    textPrimary: '#0f172a', textSecondary: 'rgba(15,23,42,0.65)',
    textTertiary: 'rgba(15,23,42,0.4)', textDisabled: 'rgba(15,23,42,0.2)',
    borderSubtle: 'rgba(15,23,42,0.06)', borderDim: 'rgba(15,23,42,0.1)',
    borderBright: 'rgba(15,23,42,0.18)',
    glass: 'rgba(15,23,42,0.02)', glassMedium: 'rgba(15,23,42,0.04)',
    glassBright: 'rgba(15,23,42,0.08)',
    isLight: true, preview: ['#f8fafc', '#e2e8f0'],
  },

  // ── 20 NEW FUN THEMES ─────────────────────────────────────────

  cherry: {
    id: 'cherry', name: 'Cherry', emoji: '🍒', description: 'Bold red',
    void: '#1a0505', cosmic: '#2d0a0a', obsidian: '#2d0a0a', slate: '#450a0a',
    surface: '#7f1d1d', elevated: '#991b1b',
    ...dark('#1a0505','#7f1d1d','#991b1b',[252,165,165]),
    preview: ['#1a0505', '#7f1d1d'],
  },
  cyberpunk: {
    id: 'cyberpunk', name: 'Cyberpunk', emoji: '🤖', description: 'Neon city',
    void: '#0a0014', cosmic: '#120024', obsidian: '#1a0033', slate: '#2d0057',
    surface: '#3b0070', elevated: '#4c008a',
    textPrimary: '#f0e6ff', textSecondary: 'rgba(240,230,255,0.7)',
    textTertiary: 'rgba(240,230,255,0.45)', textDisabled: 'rgba(240,230,255,0.2)',
    borderSubtle: 'rgba(192,132,252,0.1)', borderDim: 'rgba(192,132,252,0.15)',
    borderBright: 'rgba(192,132,252,0.25)',
    glass: 'rgba(192,132,252,0.05)', glassMedium: 'rgba(192,132,252,0.1)',
    glassBright: 'rgba(192,132,252,0.15)',
    isLight: false, preview: ['#0a0014', '#3b0070'],
  },
  bubblegum: {
    id: 'bubblegum', name: 'Bubblegum', emoji: '🫧', description: 'Pop pink',
    void: '#fdf2f8', cosmic: '#fce7f3', obsidian: '#fbcfe8', slate: '#f9a8d4',
    surface: '#fdf2f8', elevated: '#ffffff',
    textPrimary: '#831843', textSecondary: 'rgba(131,24,67,0.65)',
    textTertiary: 'rgba(131,24,67,0.4)', textDisabled: 'rgba(131,24,67,0.2)',
    borderSubtle: 'rgba(190,24,93,0.08)', borderDim: 'rgba(190,24,93,0.12)',
    borderBright: 'rgba(190,24,93,0.2)',
    glass: 'rgba(190,24,93,0.03)', glassMedium: 'rgba(190,24,93,0.06)',
    glassBright: 'rgba(190,24,93,0.1)',
    isLight: true, preview: ['#fdf2f8', '#fbcfe8'],
  },
  hacker: {
    id: 'hacker', name: 'Hacker', emoji: '💻', description: 'Matrix green',
    void: '#000800', cosmic: '#001200', obsidian: '#001a00', slate: '#002800',
    surface: '#003300', elevated: '#004400',
    textPrimary: '#00ff41', textSecondary: 'rgba(0,255,65,0.65)',
    textTertiary: 'rgba(0,255,65,0.4)', textDisabled: 'rgba(0,255,65,0.2)',
    borderSubtle: 'rgba(0,255,65,0.08)', borderDim: 'rgba(0,255,65,0.12)',
    borderBright: 'rgba(0,255,65,0.2)',
    glass: 'rgba(0,255,65,0.03)', glassMedium: 'rgba(0,255,65,0.06)',
    glassBright: 'rgba(0,255,65,0.1)',
    isLight: false, preview: ['#000800', '#003300'],
  },
  sakura: {
    id: 'sakura', name: 'Sakura', emoji: '🌸', description: 'Cherry blossom',
    void: '#1a0a12', cosmic: '#2d1020', obsidian: '#3d1530', slate: '#4d1a3d',
    surface: '#5c1f4a', elevated: '#6b245a',
    textPrimary: '#fce4ec', textSecondary: 'rgba(252,228,236,0.7)',
    textTertiary: 'rgba(252,228,236,0.45)', textDisabled: 'rgba(252,228,236,0.2)',
    borderSubtle: 'rgba(244,143,177,0.1)', borderDim: 'rgba(244,143,177,0.15)',
    borderBright: 'rgba(244,143,177,0.25)',
    glass: 'rgba(244,143,177,0.05)', glassMedium: 'rgba(244,143,177,0.1)',
    glassBright: 'rgba(244,143,177,0.15)',
    isLight: false, preview: ['#1a0a12', '#5c1f4a'],
  },
  amber: {
    id: 'amber', name: 'Amber', emoji: '🔥', description: 'Warm gold',
    void: '#1a1000', cosmic: '#2d1c00', obsidian: '#3d2600', slate: '#523400',
    surface: '#78350f', elevated: '#92400e',
    ...dark('#1a1000','#78350f','#92400e',[253,230,138]),
    preview: ['#1a1000', '#78350f'],
  },
  arctic: {
    id: 'arctic', name: 'Arctic', emoji: '🧊', description: 'Ice blue',
    void: '#eff6ff', cosmic: '#dbeafe', obsidian: '#bfdbfe', slate: '#93c5fd',
    surface: '#eff6ff', elevated: '#ffffff',
    textPrimary: '#1e3a5f', textSecondary: 'rgba(30,58,95,0.65)',
    textTertiary: 'rgba(30,58,95,0.4)', textDisabled: 'rgba(30,58,95,0.2)',
    borderSubtle: 'rgba(37,99,235,0.08)', borderDim: 'rgba(37,99,235,0.12)',
    borderBright: 'rgba(37,99,235,0.2)',
    glass: 'rgba(37,99,235,0.03)', glassMedium: 'rgba(37,99,235,0.06)',
    glassBright: 'rgba(37,99,235,0.1)',
    isLight: true, preview: ['#eff6ff', '#bfdbfe'],
  },
  dracula: {
    id: 'dracula', name: 'Dracula', emoji: '🧛', description: 'Classic Dracula',
    void: '#282a36', cosmic: '#2d2f3f', obsidian: '#343746', slate: '#44475a',
    surface: '#44475a', elevated: '#6272a4',
    textPrimary: '#f8f8f2', textSecondary: 'rgba(248,248,242,0.7)',
    textTertiary: 'rgba(248,248,242,0.45)', textDisabled: 'rgba(248,248,242,0.2)',
    borderSubtle: 'rgba(98,114,164,0.15)', borderDim: 'rgba(98,114,164,0.2)',
    borderBright: 'rgba(98,114,164,0.3)',
    glass: 'rgba(98,114,164,0.06)', glassMedium: 'rgba(98,114,164,0.1)',
    glassBright: 'rgba(98,114,164,0.15)',
    isLight: false, preview: ['#282a36', '#44475a'],
  },
  mocha: {
    id: 'mocha', name: 'Mocha', emoji: '☕', description: 'Coffee vibes',
    void: '#1e1714', cosmic: '#2c211c', obsidian: '#3b2c24', slate: '#4a362d',
    surface: '#5e4536', elevated: '#725440',
    ...dark('#1e1714','#5e4536','#725440',[211,188,170]),
    preview: ['#1e1714', '#5e4536'],
  },
  neon: {
    id: 'neon', name: 'Neon', emoji: '⚡', description: 'Electric vibes',
    void: '#0a000f', cosmic: '#10001a', obsidian: '#150025', slate: '#1f0038',
    surface: '#29004d', elevated: '#330062',
    textPrimary: '#e0e0ff', textSecondary: 'rgba(224,224,255,0.7)',
    textTertiary: 'rgba(224,224,255,0.45)', textDisabled: 'rgba(224,224,255,0.2)',
    borderSubtle: 'rgba(168,85,247,0.1)', borderDim: 'rgba(168,85,247,0.18)',
    borderBright: 'rgba(168,85,247,0.3)',
    glass: 'rgba(168,85,247,0.05)', glassMedium: 'rgba(168,85,247,0.1)',
    glassBright: 'rgba(168,85,247,0.18)',
    isLight: false, preview: ['#0a000f', '#29004d'],
  },
  coral: {
    id: 'coral', name: 'Coral', emoji: '🪸', description: 'Reef orange',
    void: '#1a0c08', cosmic: '#2d1510', obsidian: '#3d1c16', slate: '#531d15',
    surface: '#7c2d12', elevated: '#9a3412',
    ...dark('#1a0c08','#7c2d12','#9a3412',[253,186,116]),
    preview: ['#1a0c08', '#7c2d12'],
  },
  emerald: {
    id: 'emerald', name: 'Emerald', emoji: '💎', description: 'Gem green',
    void: '#ecfdf5', cosmic: '#d1fae5', obsidian: '#a7f3d0', slate: '#6ee7b7',
    surface: '#ecfdf5', elevated: '#ffffff',
    textPrimary: '#064e3b', textSecondary: 'rgba(6,78,59,0.65)',
    textTertiary: 'rgba(6,78,59,0.4)', textDisabled: 'rgba(6,78,59,0.2)',
    borderSubtle: 'rgba(5,150,105,0.08)', borderDim: 'rgba(5,150,105,0.12)',
    borderBright: 'rgba(5,150,105,0.2)',
    glass: 'rgba(5,150,105,0.03)', glassMedium: 'rgba(5,150,105,0.06)',
    glassBright: 'rgba(5,150,105,0.1)',
    isLight: true, preview: ['#ecfdf5', '#a7f3d0'],
  },
  retro: {
    id: 'retro', name: 'Retro', emoji: '🕹️', description: '80s arcade',
    void: '#0f0520', cosmic: '#1a0a30', obsidian: '#250f40', slate: '#351a55',
    surface: '#401f66', elevated: '#4f2880',
    textPrimary: '#ffd700', textSecondary: 'rgba(255,215,0,0.7)',
    textTertiary: 'rgba(255,215,0,0.45)', textDisabled: 'rgba(255,215,0,0.2)',
    borderSubtle: 'rgba(255,215,0,0.08)', borderDim: 'rgba(255,215,0,0.12)',
    borderBright: 'rgba(255,215,0,0.2)',
    glass: 'rgba(255,215,0,0.04)', glassMedium: 'rgba(255,215,0,0.08)',
    glassBright: 'rgba(255,215,0,0.12)',
    isLight: false, preview: ['#0f0520', '#401f66'],
  },
  galaxy: {
    id: 'galaxy', name: 'Galaxy', emoji: '🌌', description: 'Space vibes',
    void: '#070b1e', cosmic: '#0e1530', obsidian: '#141e42', slate: '#1c2a55',
    surface: '#243568', elevated: '#2e4080',
    textPrimary: '#e8eaff', textSecondary: 'rgba(232,234,255,0.7)',
    textTertiary: 'rgba(232,234,255,0.45)', textDisabled: 'rgba(232,234,255,0.2)',
    borderSubtle: 'rgba(147,130,255,0.1)', borderDim: 'rgba(147,130,255,0.15)',
    borderBright: 'rgba(147,130,255,0.25)',
    glass: 'rgba(147,130,255,0.05)', glassMedium: 'rgba(147,130,255,0.1)',
    glassBright: 'rgba(147,130,255,0.15)',
    isLight: false, preview: ['#070b1e', '#243568'],
  },
  mint: {
    id: 'mint', name: 'Mint', emoji: '🍃', description: 'Fresh green',
    void: '#f0fdfa', cosmic: '#ccfbf1', obsidian: '#99f6e4', slate: '#5eead4',
    surface: '#f0fdfa', elevated: '#ffffff',
    textPrimary: '#134e4a', textSecondary: 'rgba(19,78,74,0.65)',
    textTertiary: 'rgba(19,78,74,0.4)', textDisabled: 'rgba(19,78,74,0.2)',
    borderSubtle: 'rgba(13,148,136,0.08)', borderDim: 'rgba(13,148,136,0.12)',
    borderBright: 'rgba(13,148,136,0.2)',
    glass: 'rgba(13,148,136,0.03)', glassMedium: 'rgba(13,148,136,0.06)',
    glassBright: 'rgba(13,148,136,0.1)',
    isLight: true, preview: ['#f0fdfa', '#99f6e4'],
  },
  rosegold: {
    id: 'rosegold', name: 'Rose Gold', emoji: '✨', description: 'Luxury',
    void: '#1a1015', cosmic: '#2a1820', obsidian: '#3a202c', slate: '#4d2a3a',
    surface: '#5e3448', elevated: '#724058',
    textPrimary: '#fde8ef', textSecondary: 'rgba(253,232,239,0.7)',
    textTertiary: 'rgba(253,232,239,0.45)', textDisabled: 'rgba(253,232,239,0.2)',
    borderSubtle: 'rgba(244,182,204,0.1)', borderDim: 'rgba(244,182,204,0.15)',
    borderBright: 'rgba(244,182,204,0.25)',
    glass: 'rgba(244,182,204,0.05)', glassMedium: 'rgba(244,182,204,0.1)',
    glassBright: 'rgba(244,182,204,0.15)',
    isLight: false, preview: ['#1a1015', '#5e3448'],
  },
  electric: {
    id: 'electric', name: 'Electric', emoji: '🔌', description: 'Charged blue',
    void: '#001020', cosmic: '#001830', obsidian: '#002040', slate: '#003060',
    surface: '#003d7a', elevated: '#004d99',
    textPrimary: '#e0f0ff', textSecondary: 'rgba(224,240,255,0.7)',
    textTertiary: 'rgba(224,240,255,0.45)', textDisabled: 'rgba(224,240,255,0.2)',
    borderSubtle: 'rgba(56,189,248,0.1)', borderDim: 'rgba(56,189,248,0.15)',
    borderBright: 'rgba(56,189,248,0.25)',
    glass: 'rgba(56,189,248,0.05)', glassMedium: 'rgba(56,189,248,0.1)',
    glassBright: 'rgba(56,189,248,0.15)',
    isLight: false, preview: ['#001020', '#003d7a'],
  },
  crimson: {
    id: 'crimson', name: 'Crimson', emoji: '🩸', description: 'Deep red',
    void: '#140000', cosmic: '#200508', obsidian: '#300a0e', slate: '#450f15',
    surface: '#5c1520', elevated: '#7a1d2a',
    ...dark('#140000','#5c1520','#7a1d2a',[255,150,160]),
    preview: ['#140000', '#5c1520'],
  },
  tropical: {
    id: 'tropical', name: 'Tropical', emoji: '🌴', description: 'Island heat',
    void: '#fffbeb', cosmic: '#fef3c7', obsidian: '#fde68a', slate: '#fcd34d',
    surface: '#fffbeb', elevated: '#ffffff',
    textPrimary: '#78350f', textSecondary: 'rgba(120,53,15,0.65)',
    textTertiary: 'rgba(120,53,15,0.4)', textDisabled: 'rgba(120,53,15,0.2)',
    borderSubtle: 'rgba(217,119,6,0.08)', borderDim: 'rgba(217,119,6,0.12)',
    borderBright: 'rgba(217,119,6,0.2)',
    glass: 'rgba(217,119,6,0.03)', glassMedium: 'rgba(217,119,6,0.06)',
    glassBright: 'rgba(217,119,6,0.1)',
    isLight: true, preview: ['#fffbeb', '#fde68a'],
  },
  charcoal: {
    id: 'charcoal', name: 'Charcoal', emoji: '🖤', description: 'Deep matte',
    void: '#111111', cosmic: '#1a1a1a', obsidian: '#222222', slate: '#2a2a2a',
    surface: '#333333', elevated: '#3d3d3d',
    ...dark('#111111','#333333','#3d3d3d',[180,180,180]),
    preview: ['#111111', '#333333'],
  },
};

const STORAGE_KEY = 'arcadia_theme';

// ═══════════════════════════════════════════════════════════════════
// Context — exposes themedColors (base colors merged with preset)
// ═══════════════════════════════════════════════════════════════════
interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemePreset;
  isLight: boolean;
  setTheme: (id: ThemeId) => void;
  colors: typeof baseColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'midnight',
  theme: THEME_PRESETS.midnight,
  isLight: false,
  setTheme: () => {},
  colors: baseColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('midnight');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && THEME_PRESETS[saved as ThemeId]) {
        setThemeId(saved as ThemeId);
      }
    })();
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    const preset = THEME_PRESETS[id];
    if (!preset) return;
    setThemeId(id);
    AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const colors = useMemo(
    () => ({ ...baseColors, ...THEME_PRESETS[themeId] }),
    [themeId],
  );

  const value: ThemeContextValue = useMemo(
    () => ({
      themeId,
      theme: THEME_PRESETS[themeId],
      isLight: THEME_PRESETS[themeId].isLight,
      setTheme,
      colors,
    }),
    [themeId, setTheme, colors],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
