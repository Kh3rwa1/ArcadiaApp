import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../theme';
import { adminService, AdminGame } from '../services/adminService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminScreen({ onBack }: { onBack: () => void }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [apiKey, setApiKey] = useState('');
    const [games, setGames] = useState<AdminGame[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Config state
    const [showConfig, setShowConfig] = useState(false);
    const [customUrl, setCustomUrl] = useState('');

    useEffect(() => {
        checkAuth();
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const url = await adminService.getApiUrl();
        setCustomUrl(url);
    };

    const saveConfig = async () => {
        await adminService.setApiUrl(customUrl);
        setShowConfig(false);
        Alert.alert('Configuration Saved', 'Backend connection URL updated.');
    };

    const checkAuth = async () => {
        const hasKey = await adminService.hasKey();
        if (hasKey) {
            // Validate key by fetching games
            loadGames();
        } else {
            setIsLoading(false);
        }
    };

    const loadGames = async () => {
        setIsLoading(true);
        try {
            const data = await adminService.getGames();
            setGames(data);
            setIsAuthenticated(true);
        } catch (e) {
            console.error(e);
            setIsAuthenticated(false); // Key valid check failed
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleLogin = async () => {
        if (!apiKey.trim()) return;
        setIsLoading(true);
        const success = await adminService.login(apiKey);
        if (success) {
            loadGames();
        } else {
            Alert.alert('Access Denied', 'Invalid Access Code or Connection Failed.\nCheck your Backend URL in settings.');
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await adminService.logout();
        setIsAuthenticated(false);
        setApiKey('');
    };

    const toggleStatus = async (gameId: string, currentStatus: string) => {
        const success = await adminService.toggleStatus(gameId, currentStatus);
        if (success) {
            // Optimistic update
            setGames(prev => prev.map(g =>
                g.id === gameId ? { ...g, status: g.status === 'live' ? 'hidden' : 'live' } : g
            ));
        } else {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const renderLogin = () => (
        <View style={styles.loginContainer}>
            <LinearGradient colors={[colors.obsidian, 'rgba(0,0,0,0.95)']} style={StyleSheet.absoluteFill} />

            <View style={styles.lockIconContainer}>
                <View style={[styles.lockIconRing, { borderColor: colors.accent }]} />
                <Ionicons name="lock-closed" size={32} color={colors.accent} />
            </View>

            <Text style={styles.loginTitle}>Restricted Access</Text>
            <Text style={styles.loginSubtitle}>Enter Admin Credentials to Proceed</Text>

            <View style={styles.passcodeContainer}>
                <TextInput
                    style={styles.passcodeInput}
                    placeholder="Enter Key"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    secureTextEntry
                    value={apiKey}
                    onChangeText={setApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    selectionColor={colors.accent}
                />
            </View>

            <TouchableOpacity
                style={[styles.unlockButton, !apiKey && styles.unlockButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading || !apiKey}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <ActivityIndicator color={colors.void} />
                ) : (
                    <>
                        <Ionicons name="finger-print" size={20} color={colors.void} />
                        <Text style={styles.unlockButtonText}>Unlock Dashboard</Text>
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelAccess} onPress={onBack}>
                <Text style={styles.cancelAccessText}>Cancel Authentication</Text>
            </TouchableOpacity>

            {/* Connection Settings Toggle */}
            <TouchableOpacity
                style={styles.configToggle}
                onPress={() => setShowConfig(!showConfig)}
            >
                <Ionicons name="settings-outline" size={20} color={colors.textTertiary} />
                <Text style={styles.configToggleText}>{showConfig ? 'Hide Connection' : 'Server Connection'}</Text>
            </TouchableOpacity>

            {/* Config Panel */}
            {showConfig && (
                <View style={styles.configPanel}>
                    <Text style={styles.configLabel}>Backend API URL:</Text>
                    <TextInput
                        style={styles.configInput}
                        placeholder="e.g. https://api.myapp.com"
                        placeholderTextColor={colors.textDisabled}
                        value={customUrl}
                        onChangeText={setCustomUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity style={styles.saveConfigBtn} onPress={saveConfig}>
                        <Text style={styles.saveConfigText}>Save Connection</Text>
                    </TouchableOpacity>
                    <Text style={styles.configHelp}>
                        Required for Vercel deployments. Use a secured https:// URL (e.g. ngrok).
                    </Text>
                </View>
            )}
        </View>
    );

    const renderGameItem = ({ item }: { item: AdminGame }) => (
        <View style={styles.gameCard}>
            <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{item.title}</Text>
                <Text style={styles.gameVersion}>{item.version} • {item.sessions} plays</Text>
            </View>

            <View style={styles.gameActions}>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'live' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'live' ? colors.success : colors.textTertiary }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => toggleStatus(item.id, item.status)}
                >
                    <Ionicons
                        name={item.status === 'live' ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!isAuthenticated) return renderLogin();

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={[colors.obsidian, colors.void]} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.headerBtn}>
                    <Ionicons name="log-out-outline" size={24} color={colors.danger} />
                </TouchableOpacity>
            </View>

            {/* Stats Overview (Mock) */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statVal}>{games.length}</Text>
                    <Text style={styles.statLabel}>Games</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statVal}>{games.filter(g => g.status === 'live').length}</Text>
                    <Text style={styles.statLabel}>Live</Text>
                </View>
                <TouchableOpacity style={styles.uploadCard}>
                    <Ionicons name="cloud-upload-outline" size={24} color={colors.accent} />
                    <Text style={styles.uploadText}>Upload</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={games}
                renderItem={renderGameItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadGames(); }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.void,
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.void,
    },
    lockIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        position: 'relative',
    },
    lockIconRing: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 44,
        borderWidth: 1,
        opacity: 0.3,
    },
    loginTitle: {
        ...typography.headlineMedium,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    loginSubtitle: {
        ...typography.bodyMedium,
        color: colors.textSecondary,
        marginBottom: spacing.xxl,
        textAlign: 'center',
        opacity: 0.8,
    },
    passcodeContainer: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        marginBottom: spacing.xl,
    },
    passcodeInput: {
        height: 60,
        color: colors.textPrimary,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 4,
        width: '100%',
    },
    unlockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: radii.full,
        width: '100%',
        maxWidth: 280,
        justifyContent: 'center',
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    unlockButtonDisabled: {
        opacity: 0.5,
        shadowOpacity: 0,
    },
    unlockButtonText: {
        ...typography.labelLarge,
        color: colors.void,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    cancelAccess: {
        marginTop: spacing.xl,
        padding: spacing.md,
    },
    cancelAccessText: {
        ...typography.bodyMedium,
        color: colors.textTertiary,
    },
    configToggle: {
        marginTop: spacing.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.sm,
    },
    configToggleText: {
        color: colors.textTertiary,
        fontSize: 12,
    },
    configPanel: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: radii.md,
        padding: spacing.md,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    configLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    configInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: colors.textPrimary,
        padding: 8,
        borderRadius: 4,
        fontSize: 12,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    saveConfigBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 4,
        alignItems: 'center',
    },
    saveConfigText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    configHelp: {
        color: colors.textTertiary,
        fontSize: 10,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        ...typography.headlineSmall,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    headerBtn: {
        padding: spacing.xs,
    },
    statsRow: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: spacing.md,
        borderRadius: radii.md,
        alignItems: 'center',
    },
    statVal: {
        ...typography.headlineMedium,
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    statLabel: {
        ...typography.labelSmall,
        color: colors.textTertiary,
    },
    uploadCard: {
        flex: 1,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        padding: spacing.md,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        gap: spacing.xs,
    },
    uploadText: {
        ...typography.labelSmall,
        color: colors.accent,
        fontWeight: 'bold',
    },
    listContent: {
        padding: spacing.lg,
    },
    gameCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: spacing.md,
        borderRadius: radii.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    gameInfo: {
        flex: 1,
    },
    gameTitle: {
        ...typography.labelLarge,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    gameVersion: {
        ...typography.labelSmall,
        color: colors.textTertiary,
    },
    gameActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.full,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    actionButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radii.full,
    },
});
