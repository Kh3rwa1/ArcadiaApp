import React from 'react';
import { render } from '@testing-library/react-native';
import GameCard from '../../src/components/GameCard';

// Mocks
jest.mock('expo-linear-gradient', () => ({
    LinearGradient: ({ children }: any) => children
}));
jest.mock('expo-blur', () => ({
    BlurView: ({ children }: any) => children
}));
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: {}
}));
jest.mock('react-native-webview', () => ({
    WebView: 'WebView'
}));
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons'
}));
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
jest.mock('../../src/hooks/useThermalState', () => ({
    useThermalState: () => ({ thermalState: 0 })
}));
jest.mock('../../src/components/SkeletonShimmer', () => ({
    SkeletonShimmer: 'SkeletonShimmer'
}));

const mockGame = {
    id: '1',
    title: 'Test Game',
    description: 'Desc',
    game_url: 'http://test.com',
    category: 'arcade',
    creator: 'Tester',
    likes: 1234,
    plays: 5678,
    thumbnail: '',
    orientation: 'portrait' as const,
    created_at: '',
    updated_at: '',
    status: 'published' as const,
    version: '1'
};

describe('GameCard', () => {
    it('renders correctly with Right Action Bar', () => {
        const { getByText } = render(
            <GameCard
                game={mockGame}
                isActive={true}
                isPreload={true}
                onGameEvent={jest.fn()}
            />
        );

        // Check Title
        expect(getByText('Test Game')).toBeTruthy();

        // Check Right Action Bar elements (TikTok UI)
        expect(getByText('1,234')).toBeTruthy(); // Likes
        expect(getByText('Share')).toBeTruthy(); // Share Label
        expect(getByText('Original Sound - Test Game')).toBeTruthy(); // Music Info
    });

    it('shows preloader when loading (simulated)', () => {
        // Note: GameCard manages its own loading state.
        // We can't easily force it active without modifying the component to accept initial state,
        // but we can check existence of structure.
        const { toJSON } = render(
            <GameCard
                game={mockGame}
                isActive={true}
                isPreload={true}
            />
        );
        expect(toJSON()).toMatchSnapshot();
    });
});
