import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: any;
}

export const SkeletonShimmer = ({ width = '100%', height = 20, borderRadius = radii.sm, style }: SkeletonProps) => {
    const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

    useEffect(() => {
        const animate = () => {
            translateX.setValue(-SCREEN_WIDTH);
            Animated.timing(translateX, {
                toValue: SCREEN_WIDTH,
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }).start(() => animate());
        };

        animate();
    }, []);

    return (
        <View style={[styles.container, { width, height, borderRadius }, style]}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.05)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        overflow: 'hidden',
    },
});
