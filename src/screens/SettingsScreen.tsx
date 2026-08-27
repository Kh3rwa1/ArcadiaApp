import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Animated, Easing, Platform, Switch, Alert, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, radii, motion, shadows } from '../theme';
import { userService } from '../services/userService';
import { config } from '../config/environment';
import { useTheme, THEME_PRESETS, ThemeId } from '../context/ThemeContext';

interface SettingsProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// Setting Row
// ═══════════════════════════════════════════════════════════════════
const SettingRow = memo(({ icon, label, trailing, onPress, isDestructive, colors }: {
  icon: string; label: string; trailing?: React.ReactNode;
  onPress?: () => void; isDestructive?: boolean;
  colors: any;
}) => (
  <TouchableOpacity
    style={[s.settingRow, { borderBottomColor: colors.borderSubtle }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    <View style={[s.settingIcon, isDestructive && { backgroundColor: colors.dangerGlow }]}>
      <Ionicons
        name={icon as any} size={18}
        color={isDestructive ? colors.danger : colors.textSecondary}
      />
    </View>
    <Text style={[s.settingLabel, { color: isDestructive ? colors.danger : colors.textPrimary }]}>{label}</Text>
    {trailing || (onPress && <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />)}
  </TouchableOpacity>
));

// ═══════════════════════════════════════════════════════════════════
// Theme Swatch — individual theme option in the picker
// ═══════════════════════════════════════════════════════════════════
const ThemeSwatch = memo(({ themeId, isSelected, onSelect, colors }: {
  themeId: ThemeId; isSelected: boolean; onSelect: () => void;
  colors: any;
}) => {
  const preset = THEME_PRESETS[themeId];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.92, damping: 25, stiffness: 200, mass: 0.8, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, damping: 25, stiffness: 200, mass: 0.8, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onSelect}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[s.swatch, isSelected && [s.swatchSelected, { borderColor: colors.accent, backgroundColor: colors.accentPulse }], { transform: [{ scale: scaleAnim }] }]}>
        {/* Color preview */}
        <LinearGradient
          colors={preset.preview as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.swatchGradient}
        >
          {isSelected && (
            <View style={[s.swatchCheck, { backgroundColor: colors.accent }]}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          )}
        </LinearGradient>
        {/* Label */}
        <Text style={s.swatchEmoji}>{preset.emoji}</Text>
        <Text style={[s.swatchName, isSelected && [s.swatchNameSelected, { color: colors.accent }]]} numberOfLines={1}>
          {preset.name}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════════
// MAIN SETTINGS SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function SettingsScreen({ onBack }: SettingsProps) {
  const { themeId, setTheme, colors } = useTheme();
  const [username, setUsername] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadSettings();
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
  }, []);

  const loadSettings = async () => {
    const profile = await userService.getProfile();
    setUsername(profile.username);
    const haptic = await AsyncStorage.getItem('setting_haptic');
    const sound = await AsyncStorage.getItem('setting_sound');
    const motionSetting = await AsyncStorage.getItem('setting_reduced_motion');
    if (haptic !== null) setHapticEnabled(haptic === 'true');
    if (sound !== null) setSoundEnabled(sound === 'true');
    if (motionSetting !== null) setReducedMotion(motionSetting === 'true');
  };

  const saveUsername = async () => {
    if (username.trim().length > 0) {
      await userService.updateUsername(username.trim());
      setIsEditingName(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const toggleHaptic = async (val: boolean) => {
    setHapticEnabled(val);
    await AsyncStorage.setItem('setting_haptic', val.toString());
    if (val && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleSound = async (val: boolean) => {
    setSoundEnabled(val);
    await AsyncStorage.setItem('setting_sound', val.toString());
  };

  const toggleReducedMotion = async (val: boolean) => {
    setReducedMotion(val);
    await AsyncStorage.setItem('setting_reduced_motion', val.toString());
  };

  const handleThemeSelect = (id: ThemeId) => {
    setTheme(id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearData = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear your profile, progress, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onBack();
          },
        },
      ]
    );
  };

  const themeIds = Object.keys(THEME_PRESETS) as ThemeId[];

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />
      {/* Decorative mesh blobs — fixed behind scroll */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: 'absolute', top: -70, right: -40, width: 260, height: 260, borderRadius: 130, backgroundColor: colors.accent, opacity: 0.06, transform: [{ scale: 1.4 }] }} />
        <View style={{ position: 'absolute', bottom: 80, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.pink, opacity: 0.04 }} />
      </View>
      <SafeAreaView style={s.safeArea}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={[s.backButton, { backgroundColor: colors.glassMedium, borderColor: colors.borderDim }]} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ─── Appearance / Theme ─── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Ionicons name="color-palette" size={16} color={colors.accent} />
                <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>APPEARANCE</Text>
              </View>
              <View style={[s.sectionCard, { backgroundColor: colors.glassMedium, borderColor: colors.borderSubtle }]}>
                <View style={s.themeIntro}>
                  <Text style={[s.themeIntroTitle, { color: colors.textPrimary }]}>Choose Your Vibe</Text>
                  <Text style={[s.themeIntroSub, { color: colors.textTertiary }]}>
                    Pick a theme that matches your style
                  </Text>
                </View>
                <View style={s.themeGrid}>
                  {themeIds.map(id => (
                    <ThemeSwatch
                      key={id}
                      themeId={id}
                      isSelected={themeId === id}
                      onSelect={() => handleThemeSelect(id)}
                      colors={colors}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* ─── Profile ─── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Ionicons name="person" size={16} color={colors.accent} />
                <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>PROFILE</Text>
              </View>
              <View style={[s.sectionCard, { backgroundColor: colors.glassMedium, borderColor: colors.borderSubtle }]}>
                <View style={s.nameRow}>
                  <View style={[s.settingIcon, { backgroundColor: colors.glassBright }]}>
                    <Ionicons name="person" size={18} color={colors.textSecondary} />
                  </View>
                  {isEditingName ? (
                    <View style={s.nameEditRow}>
                      <TextInput
                        style={[s.nameInput, { color: colors.textPrimary, borderBottomColor: colors.accent }]}
                        value={username}
                        onChangeText={setUsername}
                        autoFocus
                        maxLength={20}
                        placeholderTextColor={colors.textTertiary}
                        selectionColor={colors.accent}
                      />
                      <TouchableOpacity onPress={saveUsername} style={[s.saveButton, { backgroundColor: colors.accent }]}>
                        <Text style={s.saveText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={[s.settingLabel, { color: colors.textPrimary }]}>{username}</Text>
                      <TouchableOpacity onPress={() => setIsEditingName(true)}>
                        <Ionicons name="pencil" size={16} color={colors.accent} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* ─── Experience ─── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Ionicons name="settings" size={16} color={colors.accent} />
                <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>EXPERIENCE</Text>
              </View>
              <View style={[s.sectionCard, { backgroundColor: colors.glassMedium, borderColor: colors.borderSubtle }]}>
                <SettingRow
                  icon="hand-left"
                  label="Haptic Feedback"
                  colors={colors}
                  trailing={
                    <Switch
                      value={hapticEnabled}
                      onValueChange={toggleHaptic}
                      trackColor={{ false: colors.borderDim, true: colors.accent }}
                      thumbColor="#FFF"
                    />
                  }
                />
                <SettingRow
                  icon="volume-high"
                  label="Sound Effects"
                  colors={colors}
                  trailing={
                    <Switch
                      value={soundEnabled}
                      onValueChange={toggleSound}
                      trackColor={{ false: colors.borderDim, true: colors.accent }}
                      thumbColor="#FFF"
                    />
                  }
                />
                <SettingRow
                  icon="speedometer"
                  label="Reduced Motion"
                  colors={colors}
                  trailing={
                    <Switch
                      value={reducedMotion}
                      onValueChange={toggleReducedMotion}
                      trackColor={{ false: colors.borderDim, true: colors.accent }}
                      thumbColor="#FFF"
                    />
                  }
                />
              </View>
            </View>

            {/* ─── About ─── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Ionicons name="information-circle" size={16} color={colors.accent} />
                <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>ABOUT</Text>
              </View>
              <View style={[s.sectionCard, { backgroundColor: colors.glassMedium, borderColor: colors.borderSubtle }]}>
                <SettingRow icon="information-circle" label="Version" colors={colors} trailing={
                  <Text style={[s.trailingText, { color: colors.textTertiary }]}>{config.APP_VERSION}</Text>
                } />
                <SettingRow icon="document-text" label="Terms of Service" colors={colors}
                  onPress={() => Linking.openURL('https://arcadia.games/terms')} />
                <SettingRow icon="shield-checkmark" label="Privacy Policy" colors={colors}
                  onPress={() => Linking.openURL('https://arcadia.games/privacy')} />
                <SettingRow icon="help-circle" label="Support" colors={colors}
                  onPress={() => Linking.openURL('mailto:support@arcadia.games')} />
              </View>
            </View>

            {/* ─── Danger Zone ─── */}
            <View style={s.section}>
              <View style={[s.sectionCard, { backgroundColor: colors.glassMedium, borderColor: colors.borderSubtle }]}>
                <SettingRow icon="trash" label="Reset All Data" onPress={clearData} isDestructive colors={colors} />
              </View>
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <Text style={[s.footerText, { color: colors.textDisabled }]}>Made with ♥ by DURRA Labs</Text>
              <Text style={[s.footerVersion, { color: colors.textDisabled }]}>Arcadia {config.APP_VERSION}</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════
const SWATCH_SIZE = 72;

const s = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { ...typography.headlineMedium, fontWeight: '800' },
  scrollContent: { paddingBottom: 120 },

  // Sections
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: spacing.sm, marginLeft: spacing.xs,
  },
  sectionTitle: {
    ...typography.labelMedium,
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  sectionCard: {
    borderRadius: radii.xl,
    borderWidth: 1, overflow: 'hidden',
  },

  // Theme Picker
  themeIntro: {
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  themeIntroTitle: {
    ...typography.headlineSmall, fontWeight: '800',
  },
  themeIntroSub: {
    ...typography.bodySmall, marginTop: 2,
  },
  themeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.sm, paddingBottom: spacing.md,
    gap: 8,
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH_SIZE, alignItems: 'center',
    paddingVertical: spacing.sm, borderRadius: radii.lg,
    borderWidth: 2, borderColor: 'transparent',
  },
  swatchSelected: {},
  swatchGradient: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  swatchCheck: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchEmoji: { fontSize: 14, marginTop: 4 },
  swatchName: {
    ...typography.labelSmall, fontSize: 9,
    marginTop: 2, textAlign: 'center',
  },
  swatchNameSelected: {},

  // Setting Rows
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { ...typography.bodyLarge, flex: 1 },
  trailingText: { ...typography.bodyMedium },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    minHeight: 52,
  },
  nameEditRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nameInput: {
    flex: 1, ...typography.bodyLarge,
    borderBottomWidth: 1, paddingVertical: 4,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: radii.sm,
  },
  saveText: { ...typography.labelMedium, color: '#FFF', fontWeight: '700' },
  footer: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 4 },
  footerText: { ...typography.bodySmall },
  footerVersion: { ...typography.labelSmall },
});
