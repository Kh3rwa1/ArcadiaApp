import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import SplashScreen from './src/screens/SplashScreen';
import GameFeedScreen from './src/screens/GameFeedScreen';
import OnboardingScreen, { hasCompletedOnboarding } from './src/screens/OnboardingScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import * as Linking from 'expo-linking';

type AppScreen = 'splash' | 'onboarding' | 'main';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load icon fonts — critical for web where they don't auto-load
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync(Ionicons.font);
      } catch (e) {
        console.warn('[App] Font loading failed:', e);
      }
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // Simple URL routing
  const url = Linking.useURL();
  const path = url ? Linking.parse(url).path : null;
  const isAdminRoute = path?.includes('admin') || false;

  const handleSplashComplete = async () => {
    const onboarded = await hasCompletedOnboarding();
    setCurrentScreen(onboarded ? 'main' : 'onboarding');
  };

  const handleOnboardingComplete = () => {
    setCurrentScreen('main');
  };

  // Show nothing until fonts load to prevent broken icon squares
  if (!fontsLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" hidden />
          <ErrorBoundary fallbackTitle="Arcadia hit a snag" onRetry={() => setCurrentScreen('splash')}>
            {currentScreen === 'splash' && (
              <SplashScreen onComplete={handleSplashComplete} />
            )}
            {currentScreen === 'onboarding' && (
              <OnboardingScreen onComplete={handleOnboardingComplete} />
            )}
            {currentScreen === 'main' && (
              <ErrorBoundary fallbackTitle="Feed crashed" onRetry={() => setCurrentScreen('splash')}>
                <GameFeedScreen initialTab={isAdminRoute ? 'admin' : 'home'} />
              </ErrorBoundary>
            )}
          </ErrorBoundary>
        </View>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    ...(Platform.OS === 'web' && {
      width: '100vw' as any,
      height: '100vh' as any,
      maxWidth: '100%',
      overflow: 'hidden',
    }),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
