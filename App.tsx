import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import GameFeedScreen from './src/screens/GameFeedScreen';

import * as Linking from 'expo-linking';

// Pure immersive experience - no navigation framework needed
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Simple URL routing
  const url = Linking.useURL();
  const path = url ? Linking.parse(url).path : null;
  const isAdminRoute = path === 'admin';

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" hidden />
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <GameFeedScreen initialTab={isAdminRoute ? 'admin' : 'home'} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    // Fix white strip on web - ensure full viewport
    ...(Platform.OS === 'web' && {
      width: '100vw' as any,
      height: '100vh' as any,
      maxWidth: '100%',
      overflow: 'hidden',
    }),
  },
});
