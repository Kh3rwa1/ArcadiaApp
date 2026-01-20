import React, { useRef, useState, useCallback, memo } from 'react';
import { StyleSheet, View, Dimensions, FlatList, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * GameCard Component: The isolated WebView container
 * Handles its own lifecycle based on visibility.
 */
const GameCard = memo(({ game, isActive, isPreload }) => {
  const webViewRef = useRef(null);

  // Communication with the HTML5 game
  const sendMessage = (type) => {
    const script = `if(window.onGameEvent) { window.onGameEvent("${type}"); }`;
    webViewRef.current?.injectJavaScript(script);
  };

  // Logic for Auto-pause / Auto-play
  React.useEffect(() => {
    if (isActive) {
      sendMessage('play');
    } else {
      sendMessage('pause');
    }
  }, [isActive]);

  // Optimization: Only render WebView if it's the active, prev, or next card
  if (!isActive && !isPreload) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View style={styles.cardContainer}>
      <WebView
        ref={webViewRef}
        source={{ uri: game.game_url }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={true}
        mediaPlaybackRequiresUserAction={false} // Autoplay
        onMessage={(event) => {
           // Handle game events (e.g., game over, level complete)
        }}
      />
      {/* UI overlays like Action Rail and Titles are handled at Screen level to maintain performance */}
    </View>
  );
});

export default function GameFeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [games, setGames] = useState([]); // Fetch from Laravel API

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80 // Card is active when 80% visible
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const nextIndex = viewableItems[0].index;
      if (nextIndex !== activeIndex) {
        ReactNativeHapticFeedback.trigger('impactLight');
        setActiveIndex(nextIndex);
      }
    }
  }).current;

  const renderItem = useCallback(({ item, index }) => {
    const isActive = index === activeIndex;
    const isPreload = Math.abs(index - activeIndex) <= 1; // Load n-1 and n+1

    return (
      <GameCard 
        game={item} 
        isActive={isActive} 
        isPreload={isPreload} 
      />
    );
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        vertical
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3} // CRITICAL: Maintains only 3 cards in memory
        removeClippedSubviews={true}
      />
      {/* Absolute positioned Action Rail and Labels go here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cardContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  webview: { flex: 1, backgroundColor: 'transparent' },
  placeholder: { flex: 1, backgroundColor: '#111' }
});
