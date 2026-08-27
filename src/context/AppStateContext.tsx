import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { Game, UserPreferences } from '../types';
import { api } from '../services/api';
import { userService, UserProfile } from '../services/userService';

// ═══════════════════════════════════════════════════════════════════════════
// App State — Single global state tree
// ═══════════════════════════════════════════════════════════════════════════

interface AppState {
  // Data
  games: Game[];
  filteredGames: Game[];
  userProfile: UserProfile | null;
  recentGameIds: string[];
  preferences: UserPreferences;

  // UI State
  activeTab: string;
  selectedCategory: string;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  searchQuery: string;
}

type AppAction =
  | { type: 'SET_GAMES'; payload: Game[] }
  | { type: 'SET_FILTERED_GAMES'; payload: Game[] }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile }
  | { type: 'SET_RECENT_GAMES'; payload: string[] }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'ADD_RECENT_GAME'; payload: string };

const initialState: AppState = {
  games: [],
  filteredGames: [],
  userProfile: null,
  recentGameIds: [],
  preferences: { likedGames: [], bookmarkedGames: [], followedCreators: [] },
  activeTab: 'home',
  selectedCategory: 'all',
  isLoading: true,
  hasCompletedOnboarding: false,
  searchQuery: '',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_GAMES':
      return { ...state, games: action.payload };
    case 'SET_FILTERED_GAMES':
      return { ...state, filteredGames: action.payload };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_RECENT_GAMES':
      return { ...state, recentGameIds: action.payload };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_CATEGORY': {
      const category = action.payload;
      const filtered = category === 'all'
        ? state.games
        : state.games.filter(g => g.category?.toLowerCase() === category.toLowerCase());
      return {
        ...state,
        selectedCategory: category,
        filteredGames: filtered.length > 0 ? filtered : state.games,
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, hasCompletedOnboarding: action.payload };
    case 'SET_SEARCH_QUERY': {
      const query = action.payload.toLowerCase().trim();
      if (!query) {
        return {
          ...state,
          searchQuery: action.payload,
          filteredGames: state.selectedCategory === 'all'
            ? state.games
            : state.games.filter(g => g.category?.toLowerCase() === state.selectedCategory.toLowerCase()),
        };
      }
      const searchFiltered = state.games.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query) ||
        g.category?.toLowerCase().includes(query) ||
        g.creator?.toLowerCase().includes(query)
      );
      return { ...state, searchQuery: action.payload, filteredGames: searchFiltered };
    }
    case 'ADD_RECENT_GAME': {
      const updated = [action.payload, ...state.recentGameIds.filter(id => id !== action.payload)].slice(0, 20);
      return { ...state, recentGameIds: updated };
    }
    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════════════

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadFeed: () => Promise<void>;
    loadProfile: () => Promise<void>;
    loadRecentGames: () => Promise<void>;
    setActiveTab: (tab: string) => void;
    setCategory: (category: string) => void;
    setSearchQuery: (query: string) => void;
    addRecentGame: (gameId: string) => void;
    getGameById: (id: string) => Game | undefined;
    getTrendingGames: () => Game[];
    getGamesByCategory: (category: string) => Game[];
  };
}

const AppStateContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children, initialTab = 'home' }: { children: ReactNode; initialTab?: string }) {
  const [state, dispatch] = useReducer(appReducer, { ...initialState, activeTab: initialTab });

  const loadFeed = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const feedData = await api.getFeed();
      dispatch({ type: 'SET_GAMES', payload: feedData });
      dispatch({ type: 'SET_FILTERED_GAMES', payload: feedData });
    } catch (error) {
      console.error('[AppState] Failed to load feed:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const profile = await userService.getProfile();
    dispatch({ type: 'SET_USER_PROFILE', payload: profile });
  }, []);

  const loadRecentGames = useCallback(async () => {
    const recentIds = await userService.getRecentGames();
    dispatch({ type: 'SET_RECENT_GAMES', payload: recentIds });
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const setCategory = useCallback((category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const addRecentGame = useCallback((gameId: string) => {
    dispatch({ type: 'ADD_RECENT_GAME', payload: gameId });
    userService.addToRecentGames(gameId);
  }, []);

  const getGameById = useCallback((id: string) => {
    return state.games.find(g => g.id === id);
  }, [state.games]);

  const getTrendingGames = useCallback(() => {
    return [...state.games]
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 10);
  }, [state.games]);

  const getGamesByCategory = useCallback((category: string) => {
    return state.games.filter(g => g.category?.toLowerCase() === category.toLowerCase());
  }, [state.games]);

  // Boot sequence
  useEffect(() => {
    const boot = async () => {
      await Promise.all([loadFeed(), loadProfile(), loadRecentGames()]);
    };
    boot();
  }, [loadFeed, loadProfile, loadRecentGames]);

  const actions = {
    loadFeed,
    loadProfile,
    loadRecentGames,
    setActiveTab,
    setCategory,
    setSearchQuery,
    addRecentGame,
    getGameById,
    getTrendingGames,
    getGamesByCategory,
  };

  return (
    <AppStateContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
}
