import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_KEY = 'arcadia_admin_key';
const STORAGE_KEY_URL = 'arcadia_api_url';
const LOCAL_IP = '192.168.0.101'; // Fallback

// Default to empty for web (relative) unless overridden
let currentApiBase = Platform.OS === 'web' ? '' : `http://${LOCAL_IP}:8000`;

export interface AdminGame {
    id: string;
    title: string;
    status: 'live' | 'hidden';
    sessions: string;
    retention: string;
    avgTime: string;
    version: string;
    url: string;
}

export const adminService = {
    async init() {
        // Load custom URL if valid
        const storedUrl = await AsyncStorage.getItem(STORAGE_KEY_URL);
        if (storedUrl) {
            currentApiBase = storedUrl;
        }
    },

    async setApiUrl(url: string) {
        // Ensure no trailing slash
        const cleanUrl = url.replace(/\/$/, '');
        currentApiBase = cleanUrl;
        await AsyncStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    },

    async getApiUrl() {
        return currentApiBase;
    },

    async hasKey(): Promise<boolean> {
        const key = await AsyncStorage.getItem(STORAGE_KEY_KEY);
        // Ensure URL is loaded
        if (!currentApiBase) await this.init();
        return !!key;
    },

    async login(key: string): Promise<boolean> {
        if (!currentApiBase) await this.init();
        try {
            console.log('Admin Login connecting to:', `${currentApiBase}/api/admin/games`);
            const response = await fetch(`${currentApiBase}/api/admin/games`, {
                headers: {
                    'X-Arcadia-Admin-Key': key,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                await AsyncStorage.setItem(STORAGE_KEY_KEY, key);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Admin login failed:', e);
            return false;
        }
    },

    async logout(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY_KEY);
    },

    async getGames(): Promise<AdminGame[]> {
        if (!currentApiBase) await this.init();
        const key = await AsyncStorage.getItem(STORAGE_KEY_KEY);
        if (!key) throw new Error('No admin key');

        const response = await fetch(`${currentApiBase}/api/admin/games`, {
            headers: {
                'X-Arcadia-Admin-Key': key,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Fetch failed');
        return await response.json();
    },

    async toggleStatus(gameId: string, currentStatus: string): Promise<boolean> {
        const key = await AsyncStorage.getItem(STORAGE_KEY_KEY);
        if (!key) return false;

        const newStatus = currentStatus === 'live' ? false : true;

        try {
            const response = await fetch(`${currentApiBase}/api/admin/games/${gameId}/status`, {
                method: 'PATCH',
                headers: {
                    'X-Arcadia-Admin-Key': key,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ is_active: newStatus })
            });
            return response.ok;
        } catch {
            return false;
        }
    },

    async toggleFeatured(gameId: string): Promise<boolean> {
        const key = await AsyncStorage.getItem(STORAGE_KEY_KEY);
        if (!key) return false;

        try {
            const response = await fetch(`${currentApiBase}/api/admin/games/${gameId}/toggle-featured`, {
                method: 'POST',
                headers: {
                    'X-Arcadia-Admin-Key': key,
                    'Accept': 'application/json'
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
};
