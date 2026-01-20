import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../theme';
import { Game } from '../types';

interface Props {
    game: Game;
    creator?: string;
    onFollow?: () => void;
    isFollowing?: boolean;
}

export default function GameOverlay({
    game,
    creator = 'Arcadia Labs',
    onFollow,
    isFollowing = false
}: Props) {
    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Premium multi-layer gradient */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                locations={[0, 0.3, 0.6, 1]}
                style={styles.gradient}
            />

            {/* Accent glow at bottom */}
            <LinearGradient
                colors={['transparent', colors.accentPulse]}
                style={styles.accentGlow}
            />

            {/* Content Container */}
            <View style={styles.content} pointerEvents="box-none">
                {/* Creator Row with Follow Button */}
                <View style={styles.creatorSection}>
                    <TouchableOpacity style={styles.creatorRow} activeOpacity={0.8}>
                        <LinearGradient
                            colors={colors.gradientAccent}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{creator[0]}</Text>
                        </LinearGradient>

                        <View style={styles.creatorInfo}>
                            <View style={styles.creatorNameRow}>
                                <Text style={styles.creatorName}>{creator}</Text>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark" size={10} color={colors.void} />
                                </View>
                            </View>
                            <Text style={styles.creatorHandle}>@{creator.toLowerCase().replace(' ', '')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.followButton, isFollowing && styles.followButtonActive]}
                        onPress={onFollow}
                        activeOpacity={0.8}
                    >
                        {isFollowing ? (
                            <Text style={styles.followingText}>Following</Text>
                        ) : (
                            <LinearGradient
                                colors={colors.gradientAccent}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.followGradient}
                            >
                                <Text style={styles.followText}>Follow</Text>
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Title with premium typography */}
                <Text style={styles.title}>{game.title}</Text>

                {/* Description */}
                {game.description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {game.description}
                    </Text>
                )}

                {/* Tags with glass effect */}
                <View style={styles.tagContainer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagEmoji}>🎮</Text>
                        <Text style={styles.tagText}>{game.category || 'Casual'}</Text>
                    </View>
                    <View style={styles.tag}>
                        <Text style={styles.tagEmoji}>⚡</Text>
                        <Text style={styles.tagText}>Quick Play</Text>
                    </View>
                    {game.trending && (
                        <View style={[styles.tag, styles.tagTrending]}>
                            <Text style={styles.tagEmoji}>🔥</Text>
                            <Text style={[styles.tagText, styles.tagTrendingText]}>Trending</Text>
                        </View>
                    )}
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        pointerEvents: 'box-none',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
    },
    accentGlow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        pointerEvents: 'none',
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl + spacing.lg,
        gap: spacing.md,
        pointerEvents: 'box-none',
    },

    // Creator Section
    creatorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.void,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    creatorInfo: {
        flex: 1,
    },
    creatorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    creatorName: {
        ...typography.labelLarge,
        color: colors.textPrimary,
    },
    verifiedBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatorHandle: {
        ...typography.bodySmall,
        color: colors.textTertiary,
        marginTop: 2,
    },

    // Follow Button
    followButton: {
        borderRadius: radii.sm,
        overflow: 'hidden',
    },
    followButtonActive: {
        borderWidth: 1,
        borderColor: colors.borderBright,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    followGradient: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
    },
    followText: {
        ...typography.labelMedium,
        color: colors.textPrimary,
    },
    followingText: {
        ...typography.labelMedium,
        color: colors.textSecondary,
    },

    // Title & Description
    title: {
        ...typography.displaySmall,
        color: colors.textPrimary,
    },
    description: {
        ...typography.bodyMedium,
        color: colors.textSecondary,
        lineHeight: 20,
    },

    // Tags
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.sm,
        backgroundColor: colors.glassBright,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    tagTrending: {
        backgroundColor: colors.dangerGlow,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    tagEmoji: {
        fontSize: 12,
    },
    tagText: {
        ...typography.labelSmall,
        color: colors.textSecondary,
    },
    tagTrendingText: {
        color: colors.danger,
    },

});
