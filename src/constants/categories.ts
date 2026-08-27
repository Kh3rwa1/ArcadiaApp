// ═══════════════════════════════════════════════════════════════════════════
// Shared Constants — Single source of truth for categories, gradients, etc.
// Used across GameCard, DiscoverScreen, LibraryScreen, OnboardingScreen, etc.
// ═══════════════════════════════════════════════════════════════════════════

export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  gradient: readonly [string, string];
  gradientFull: readonly [string, string, string];
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'all', name: 'All', icon: 'apps', emoji: '🎮', gradient: ['#6366F1', '#8B5CF6'] as const, gradientFull: ['#6366f1', '#8b5cf6', '#a855f7'] as const },
  { id: 'arcade', name: 'Arcade', icon: 'game-controller', emoji: '👾', gradient: ['#6366F1', '#4F46E5'] as const, gradientFull: ['#6366f1', '#8b5cf6', '#a855f7'] as const },
  { id: 'action', name: 'Action', icon: 'flash', emoji: '⚡', gradient: ['#F43F5E', '#E11D48'] as const, gradientFull: ['#ef4444', '#f97316', '#fbbf24'] as const },
  { id: 'puzzle', name: 'Puzzle', icon: 'extension-puzzle', emoji: '🧩', gradient: ['#8B5CF6', '#7C3AED'] as const, gradientFull: ['#8b5cf6', '#6366f1', '#3b82f6'] as const },
  { id: 'endless', name: 'Endless', icon: 'infinite', emoji: '♾️', gradient: ['#3B82F6', '#2563EB'] as const, gradientFull: ['#3b82f6', '#06b6d4', '#14b8a6'] as const },
  { id: 'zen', name: 'Zen', icon: 'leaf', emoji: '🍃', gradient: ['#10B981', '#059669'] as const, gradientFull: ['#10b981', '#059669', '#047857'] as const },
  { id: 'brain', name: 'Brain', icon: 'brain', emoji: '🧠', gradient: ['#F59E0B', '#D97706'] as const, gradientFull: ['#f59e0b', '#d97706', '#b45309'] as const },
  { id: 'strategy', name: 'Strategy', icon: 'chess', emoji: '♟️', gradient: ['#EC4899', '#DB2777'] as const, gradientFull: ['#ec4899', '#f43f5e', '#ef4444'] as const },
  { id: 'casual', name: 'Casual', icon: 'happy', emoji: '😊', gradient: ['#14B8A6', '#0D9488'] as const, gradientFull: ['#14b8a6', '#06b6d4', '#3b82f6'] as const },
  { id: 'physics', name: 'Physics', icon: 'planet', emoji: '🪐', gradient: ['#06B6D4', '#0891B2'] as const, gradientFull: ['#06b6d4', '#3b82f6', '#8b5cf6'] as const },
  { id: 'rhythm', name: 'Rhythm', icon: 'musical-notes', emoji: '🎵', gradient: ['#F472B6', '#EC4899'] as const, gradientFull: ['#f472b6', '#ec4899', '#8b5cf6'] as const },
  { id: 'educational', name: 'Educational', icon: 'school', emoji: '📚', gradient: ['#34D399', '#10B981'] as const, gradientFull: ['#10b981', '#059669', '#047857'] as const },
];

const CATEGORY_GRADIENT_MAP: Record<string, readonly [string, string, string]> = {};
const CATEGORY_EMOJI_MAP: Record<string, string> = {};
const CATEGORY_GRADIENT_PAIR_MAP: Record<string, readonly [string, string]> = {};
const CATEGORY_CONFIG_MAP: Record<string, CategoryConfig> = {};

for (const cat of CATEGORIES) {
  CATEGORY_GRADIENT_MAP[cat.id] = cat.gradientFull;
  CATEGORY_EMOJI_MAP[cat.id] = cat.emoji;
  CATEGORY_GRADIENT_PAIR_MAP[cat.id] = cat.gradient;
  CATEGORY_CONFIG_MAP[cat.id] = cat;
}

export const CATEGORY_GRADIENTS = CATEGORY_GRADIENT_MAP;
export const CATEGORY_EMOJI = CATEGORY_EMOJI_MAP;
export const CATEGORY_GRADIENT_PAIRS = CATEGORY_GRADIENT_PAIR_MAP;
export const CATEGORY_CONFIG = CATEGORY_CONFIG_MAP;

export const DEFAULT_GRADIENT: readonly [string, string, string] = ['#6366f1', '#8b5cf6', '#a855f7'];

export function getCategoryGradient(category?: string): readonly [string, string, string] {
  const key = (category || '').toLowerCase();
  return CATEGORY_GRADIENT_MAP[key] || DEFAULT_GRADIENT;
}

export function getCategoryEmoji(category?: string): string {
  const key = (category || '').toLowerCase();
  return CATEGORY_EMOJI_MAP[key] || '🎮';
}

export function getCategoryGradientPair(category?: string): readonly [string, string] {
  const key = (category || '').toLowerCase();
  return CATEGORY_GRADIENT_PAIR_MAP[key] || ['#6366F1', '#8B5CF6'];
}

export function getCategoryConfig(category?: string): CategoryConfig {
  const key = (category || '').toLowerCase();
  return CATEGORY_CONFIG_MAP[key] || CATEGORIES[1]; // Default to arcade
}
