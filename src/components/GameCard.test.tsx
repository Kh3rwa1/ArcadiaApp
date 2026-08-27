import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => children,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Heavy: 'heavy', Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// react-native-reanimated is mocked via moduleNameMapper in jest.config.js

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  mergeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  flushGetRequests: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiMerge: jest.fn(),
}));

jest.mock('../hooks/useThermalState', () => ({
  useThermalState: () => ({
    thermalState: 'nominal',
    qualityLevel: 1.0,
    isThrottled: false,
    shouldReduceAnimations: false,
    shouldDisableMeshGradients: false,
  }),
}));

jest.mock('../hooks/useGameBridge', () => ({
  useGameBridge: () => ({
    sendMessage: jest.fn(),
    handleNativeMessage: jest.fn(),
    handleContentProcessDidTerminate: jest.fn(),
  }),
}));

jest.mock('../services/gameProgressService', () => ({
  gameProgressService: {
    getUserId: jest.fn().mockResolvedValue('test-user'),
    getProgress: jest.fn().mockResolvedValue(null),
    saveProgress: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../services/shareService', () => ({
  shareService: {
    shareGame: jest.fn(),
  },
}));

jest.mock('../config/environment', () => ({
  getStatsUrl: jest.fn((id: string) => `http://localhost:3001/api/v1/games/${id}/stats`),
  config: {
    apiBase: 'http://localhost:3001',
    laravelApiBase: 'http://localhost:8000',
  },
}));

jest.mock('./SkeletonShimmer', () => ({
  SkeletonShimmer: 'SkeletonShimmer',
}));

const GameCard = require('./GameCard').default;

const defaultProps = {
  game: {
    id: 'test-game',
    title: 'Test Game',
    description: 'A test game',
    game_url: 'https://example.com/game.html',
    version: '1.0.0',
    creator: 'Test Creator',
    category: 'Arcade',
    trending: false,
    likes: 100,
    plays: 500,
  },
  isActive: true,
  isPreload: false,
  onGameEvent: jest.fn(),
  onInteractionStart: jest.fn(),
  onInteractionEnd: jest.fn(),
};

describe('GameCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<GameCard {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders a view container', () => {
    const { toJSON } = render(<GameCard {...defaultProps} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree!.type).toBe('View');
  });

  it('handles minimal props', () => {
    const { toJSON } = render(
      <GameCard
        game={{
          id: 'minimal',
          title: 'Minimal',
          game_url: 'https://example.com',
          version: '1.0',
        }}
        isActive={false}
        isPreload={false}
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('does not crash when inactive', () => {
    const { toJSON } = render(
      <GameCard {...defaultProps} isActive={false} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('does not crash when preloaded', () => {
    const { toJSON } = render(
      <GameCard {...defaultProps} isActive={false} isPreload={true} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
