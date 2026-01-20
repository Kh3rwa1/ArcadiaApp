import React from 'react';
import { View, StyleSheet } from 'react-native';
import GameFeedScreen from '../screens/GameFeedScreen';
import { colors } from '../theme';

// Pure full-screen experience - no navigation, no tabs, just content
export default function MainNavigator() {
    return (
        <View style={styles.container}>
            <GameFeedScreen />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.void,
    },
});
