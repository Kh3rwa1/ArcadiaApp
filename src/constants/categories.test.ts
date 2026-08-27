import {
  CATEGORIES,
  getCategoryGradient,
  getCategoryEmoji,
  getCategoryConfig,
  getCategoryGradientPair,
  CATEGORY_GRADIENTS,
  CATEGORY_EMOJI,
  CATEGORY_GRADIENT_PAIRS,
  CATEGORY_CONFIG,
  DEFAULT_GRADIENT,
} from './categories';

describe('CATEGORIES', () => {
  it('has 12 categories', () => {
    expect(CATEGORIES).toHaveLength(12);
  });

  it('all categories have required fields', () => {
    CATEGORIES.forEach((cat) => {
      expect(typeof cat.id).toBe('string');
      expect(typeof cat.name).toBe('string');
      expect(typeof cat.icon).toBe('string');
      expect(typeof cat.emoji).toBe('string');
      expect(Array.isArray(cat.gradient)).toBe(true);
      expect(cat.gradient).toHaveLength(2);
      expect(Array.isArray(cat.gradientFull)).toBe(true);
      expect(cat.gradientFull).toHaveLength(3);
      expect(cat.gradient.every((c: string) => typeof c === 'string')).toBe(true);
      expect(cat.gradientFull.every((c: string) => typeof c === 'string')).toBe(true);
    });
  });

  it('each category has a unique id', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getCategoryGradient', () => {
  it('returns correct gradient for a known category', () => {
    const result = getCategoryGradient('arcade');
    expect(result).toEqual(['#6366f1', '#8b5cf6', '#a855f7']);
  });

  it('returns correct gradient for action category', () => {
    const result = getCategoryGradient('action');
    expect(result).toEqual(['#ef4444', '#f97316', '#fbbf24']);
  });

  it('is case-insensitive', () => {
    expect(getCategoryGradient('ARCADE')).toEqual(getCategoryGradient('arcade'));
  });

  it('returns default gradient for unknown category', () => {
    expect(getCategoryGradient('nonexistent')).toEqual(DEFAULT_GRADIENT);
  });

  it('returns default gradient for undefined', () => {
    expect(getCategoryGradient(undefined)).toEqual(DEFAULT_GRADIENT);
  });

  it('returns default gradient for empty string', () => {
    expect(getCategoryGradient('')).toEqual(DEFAULT_GRADIENT);
  });
});

describe('getCategoryEmoji', () => {
  it('returns correct emoji for known category', () => {
    expect(getCategoryEmoji('arcade')).toBe('👾');
    expect(getCategoryEmoji('action')).toBe('⚡');
    expect(getCategoryEmoji('puzzle')).toBe('🧩');
  });

  it('is case-insensitive', () => {
    expect(getCategoryEmoji('ARCADE')).toBe('👾');
  });

  it('returns default emoji for unknown category', () => {
    expect(getCategoryEmoji('nonexistent')).toBe('🎮');
  });

  it('returns default emoji for undefined', () => {
    expect(getCategoryEmoji(undefined)).toBe('🎮');
  });
});

describe('getCategoryConfig', () => {
  it('returns full config for known category', () => {
    const config = getCategoryConfig('arcade');
    expect(config.id).toBe('arcade');
    expect(config.name).toBe('Arcade');
    expect(config.emoji).toBe('👾');
    expect(config.gradient).toEqual(['#6366F1', '#4F46E5']);
  });

  it('is case-insensitive', () => {
    expect(getCategoryConfig('ARCADE').id).toBe('arcade');
  });

  it('defaults to arcade config for unknown category', () => {
    const config = getCategoryConfig('nonexistent');
    expect(config.id).toBe('arcade');
    expect(config.name).toBe('Arcade');
  });

  it('defaults to arcade config for undefined', () => {
    const config = getCategoryConfig(undefined);
    expect(config.id).toBe('arcade');
  });
});

describe('getCategoryGradientPair', () => {
  it('returns correct pair for known category', () => {
    expect(getCategoryGradientPair('arcade')).toEqual(['#6366F1', '#4F46E5']);
  });

  it('returns default pair for unknown category', () => {
    expect(getCategoryGradientPair('nonexistent')).toEqual(['#6366F1', '#8B5CF6']);
  });
});

describe('precomputed maps', () => {
  it('CATEGORY_GRADIENTS has all category ids', () => {
    CATEGORIES.forEach((cat) => {
      expect(CATEGORY_GRADIENTS[cat.id]).toBeDefined();
      expect(CATEGORY_GRADIENTS[cat.id]).toEqual(cat.gradientFull);
    });
  });

  it('CATEGORY_EMOJI has all category ids', () => {
    CATEGORIES.forEach((cat) => {
      expect(CATEGORY_EMOJI[cat.id]).toBe(cat.emoji);
    });
  });

  it('CATEGORY_GRADIENT_PAIRS has all category ids', () => {
    CATEGORIES.forEach((cat) => {
      expect(CATEGORY_GRADIENT_PAIRS[cat.id]).toEqual(cat.gradient);
    });
  });

  it('CATEGORY_CONFIG has all category ids', () => {
    CATEGORIES.forEach((cat) => {
      expect(CATEGORY_CONFIG[cat.id]).toBe(cat);
    });
  });
});
