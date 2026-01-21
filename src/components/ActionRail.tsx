import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radii, shadows } from '../theme';

interface ActionButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon?: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    isActive?: boolean;
    showGradient?: boolean;
    accentColor?: string;
}

function ActionButton({
    icon,
    activeIcon,
    label,
    onPress,
    isActive,
    showGradient = false,
    accentColor = colors.accent
}: ActionButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            Animated.spring(glowAnim, {
                toValue: 1,
                damping: 15,
                stiffness: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(glowAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [isActive]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            damping: 18,
            stiffness: 350,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            damping: 14,
            stiffness: 180,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(
                isActive ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
            );
        }
        onPress?.();
    };

    const displayIcon = isActive && activeIcon ? activeIcon : icon;

    return (
        <TouchableOpacity
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <Animated.View
                style={[
                    styles.button,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                {/* Glow effect for active state */}
                <Animated.View
                    style={[
                        styles.buttonGlow,
                        {
                            opacity: glowAnim,
                            backgroundColor: accentColor,
                        }
                    ]}
                />

                <View style={[
                    styles.iconContainer,
                    isActive && { borderColor: accentColor }
                ]}>
                    {showGradient && isActive ? (
                        <LinearGradient
                            colors={colors.gradientPremium}
                            style={styles.iconGradient}
                        >
                            <Ionicons
                                name={displayIcon}
                                size={26}
                                color={colors.textPrimary}
                            />
                        </LinearGradient>
                    ) : (
                        <Ionicons
                            name={displayIcon}
                            size={26}
                            color={isActive ? accentColor : colors.textPrimary}
                        />
                    )}
                </View>
                <Text style={[
                    styles.label,
                    isActive && { color: accentColor }
                ]}>
                    {label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

// Floating Comment Button
function CommentButton({ count, onPress }: { count: number; onPress?: () => void }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            damping: 18,
            stiffness: 350,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            damping: 12,
            stiffness: 200,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <Animated.View style={[styles.button, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.iconContainer}>
                    <Ionicons name="chatbubble-ellipses" size={24} color={colors.textPrimary} />
                </View>
                <Text style={styles.label}>{formatCount(count)}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

// Bookmark Button
function BookmarkButton({ isBookmarked, onPress }: { isBookmarked: boolean; onPress?: () => void }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.3, damping: 8, stiffness: 400, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true }),
        ]).start();

        onPress?.();
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
            <Animated.View style={[styles.button, { transform: [{ scale: scaleAnim }] }]}>
                <View style={[styles.iconContainer, isBookmarked && { borderColor: colors.gold }]}>
                    <Ionicons
                        name={isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={24}
                        color={isBookmarked ? colors.gold : colors.textPrimary}
                    />
                </View>
                <Text style={[styles.label, isBookmarked && { color: colors.gold }]}>Save</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

function formatCount(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

interface Props {
    likes?: number;
    comments?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    onLike?: () => void;
    onComment?: () => void;
    onShare?: () => void;
    onBookmark?: () => void;
    onRestart?: () => void;
}

export default function ActionRail({
    likes = 0,
    comments = 0,
    isLiked,
    isBookmarked,
    onLike,
    onComment,
    onShare,
    onBookmark,
    onRestart
}: Props) {
    // Animate likes when changing
    const [displayLikes, setDisplayLikes] = useState(likes);
    const likeCountAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (likes !== displayLikes) {
            Animated.sequence([
                Animated.timing(likeCountAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(likeCountAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start(() => setDisplayLikes(likes));
        }
    }, [likes]);

    return (
        <View style={styles.container}>
            {/* Like Button with heart animation */}
            <ActionButton
                icon="heart-outline"
                activeIcon="heart"
                label={formatCount(displayLikes)}
                onPress={onLike}
                isActive={isLiked}
                showGradient={true}
                accentColor={colors.pink}
            />

            {/* Comments */}
            <CommentButton count={comments} onPress={onComment} />

            {/* Share */}
            <ActionButton
                icon="arrow-redo"
                label="Share"
                onPress={onShare}
            />

            {/* Bookmark */}
            <BookmarkButton isBookmarked={isBookmarked || false} onPress={onBookmark} />

            {/* Restart Game */}
            <ActionButton
                icon="refresh"
                label="Restart"
                onPress={onRestart}
                accentColor={colors.cyan}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: spacing.md,
        bottom: 100,
        alignItems: 'center',
        gap: spacing.md,
        zIndex: 10,
    },
    button: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    buttonGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 40,
        opacity: 0.3,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.glassBright,
        borderWidth: 1,
        borderColor: colors.borderDim,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        ...typography.labelSmall,
        color: colors.textSecondary,
        marginTop: 2,
    },

});
