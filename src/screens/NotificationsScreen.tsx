import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, radii, motion } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';

interface NotificationsProps {
  onBack: () => void;
  onLaunchGame: (gameId: string) => void;
}

interface Notification {
  id: string;
  type: 'new_game' | 'streak' | 'achievement' | 'challenge' | 'system';
  title: string;
  body: string;
  icon: string;
  iconColor: string;
  time: string;
  isRead: boolean;
  gameId?: string;
}

const generateNotifications = (streakCount: number, gamesPlayed: number, colors: any): Notification[] => {
  const n: Notification[] = [];
  const now = Date.now();

  n.push({
    id: 'welcome', type: 'system',
    title: 'Welcome to Arcadia! 🎮',
    body: 'Swipe through 35+ instant games. No downloads needed.',
    icon: 'rocket', iconColor: colors.accent, time: '1d ago', isRead: true,
  });

  if (streakCount >= 3) {
    n.unshift({
      id: 'streak', type: 'streak',
      title: `${streakCount}-Day Streak! 🔥`,
      body: "You're on fire! Keep playing daily for bonus XP.",
      icon: 'flame', iconColor: '#FF6B35', time: 'Today', isRead: false,
    });
  }

  if (gamesPlayed >= 1) {
    n.unshift({
      id: 'newgames', type: 'new_game',
      title: 'New Games Added 🆕',
      body: 'Check out Neon Rhythm and Gravity Jump — just dropped!',
      icon: 'sparkles', iconColor: colors.pink, time: '2h ago', isRead: false,
      gameId: 'neon-rhythm',
    });
  }

  if (gamesPlayed >= 5) {
    n.unshift({
      id: 'challenge', type: 'challenge',
      title: 'Challenge: Speed Runner',
      body: 'Score 100+ in 3 different arcade games this week!',
      icon: 'trophy', iconColor: colors.gold, time: '5h ago', isRead: false,
    });
  }

  if (gamesPlayed >= 10) {
    n.unshift({
      id: 'achieve', type: 'achievement',
      title: 'Achievement Unlocked! 🏅',
      body: "You earned 'Enthusiast' — played 10 games!",
      icon: 'medal', iconColor: colors.success, time: '1d ago', isRead: true,
    });
  }

  return n;
};

const NotificationItem = memo(({ item, onPress }: {
  item: Notification; onPress: () => void;
}) => {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    notifItem: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      padding: spacing.md, borderRadius: radii.lg,
      backgroundColor: colors.glassMedium, borderWidth: 1,
      borderColor: colors.borderSubtle, marginBottom: spacing.sm,
    },
    notifUnread: { borderColor: colors.accentPulse, backgroundColor: colors.accentPulse },
    notifIcon: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
    },
    notifContent: { flex: 1 },
    notifHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    notifTitle: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '700', flex: 1 },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent,
    },
    notifBody: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    notifTime: { ...typography.labelSmall, color: colors.textDisabled, marginTop: 4 },
    notifAction: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.accentPulse, alignItems: 'center', justifyContent: 'center',
    },
  }), [colors]);

  return (
    <TouchableOpacity
      style={[styles.notifItem, !item.isRead && styles.notifUnread]}
      onPress={onPress} activeOpacity={0.7}
    >
      <View style={[styles.notifIcon, { backgroundColor: item.iconColor + '18' }]}>
        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>
      {item.gameId && (
        <View style={styles.notifAction}>
          <Ionicons name="play" size={14} color={colors.accent} />
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function NotificationsScreen({ onBack, onLaunchGame }: NotificationsProps) {
  const { themeId, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.void },
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    },
    backButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.glassMedium, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.borderDim,
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    headerTitle: { ...typography.headlineMedium, color: colors.textPrimary, fontWeight: '800' },
    badge: {
      backgroundColor: colors.danger, minWidth: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
    },
    badgeText: { ...typography.labelSmall, color: '#FFF', fontWeight: '800', fontSize: 10 },
    markAllBtn: { padding: spacing.sm },
    markAllText: { ...typography.labelMedium, color: colors.accent },
    scrollContent: { padding: spacing.lg, paddingBottom: 120 },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
    emptyTitle: { ...typography.headlineSmall, color: colors.textSecondary },
    emptySubtitle: { ...typography.bodyMedium, color: colors.textTertiary },
  }), [colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600,
        easing: Easing.bezier(...(motion.easing.smooth as [number, number, number, number])),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600,
        easing: Easing.bezier(...(motion.easing.smooth as [number, number, number, number])),
        useNativeDriver: true,
      }),
    ]).start();
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const profile = await userService.getProfile();
    const notifs = generateNotifications(
      profile.streak.current,
      profile.stats.gamesPlayed,
      colors
    );
    setNotifications(notifs);
  };

  const handlePress = (item: Notification) => {
    if (item.gameId) onLaunchGame(item.gameId);
    setNotifications(prev =>
      prev.map(n => n.id === item.id ? { ...n, isRead: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.void }]}>
      <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />
      {/* Decorative mesh blobs — fixed behind scroll */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: 'absolute', top: -70, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: colors.accent, opacity: 0.05, transform: [{ scale: 1.3 }] }} />
        <View style={{ position: 'absolute', bottom: 60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.pink, opacity: 0.04 }} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
          >
            <Text style={[styles.markAllText, { color: colors.accent }]}>Read all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textDisabled} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>All caught up!</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>No new notifications</Text>
              </View>
            ) : (
              notifications.map(item => (
                <NotificationItem
                  key={item.id} item={item}
                  onPress={() => handlePress(item)}
                />
              ))
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
