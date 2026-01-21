import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

const STORAGE_KEY_KEY = 'arcadia_admin_key';

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
    /**
     * Initialize dependencies
     */
    async init() {
        await apiClient.init();
    },

    /**
     * Get Current API URL from Client
     */
    async getApiUrl() {
        return await apiClient.getBaseUrl();
    },

    /**
     * Update API URL via Client
     */
    async setApiUrl(url: string) {
        await apiClient.setBaseUrl(url);
    },

    /**
     * Check if stored key exists
     */
    async hasKey(): Promise<boolean> {
        const key = await AsyncStorage.getItem(STORAGE_KEY_KEY);
        // Ensure client is ready
        await this.init();
        return !!key;
    },

    /**
     * Perform login/validation
     */
    async login(key: string): Promise<boolean> {
        await this.init();
        const baseUrl = await apiClient.getBaseUrl();

        try {
            console.log('Admin Login connecting to:', `${baseUrl}/api/admin/games`);
            const response = await fetch(`${baseUrl}/api/admin/games`, {
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
        await this.init();
        const baseUrl = await apiClient.getBaseUrl();
        const key = await AsyncStorage.getItem(STORAGE_KEY_KEY);

        if (!key) throw new Error('No admin key');

        const response = await fetch(`${baseUrl}/api/admin/games`, {
            headers: {
                'X-Arcadia-Admin-Key': key,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Fetch failed');
        const json = await response.json();
        return json.data || [];
    },

    async toggleStatus(gameId: string, currentStatus: string): Promise<boolean> {
        const key = await AsyncStorage.getItem(STORAGE_KEY_KEY);
        if (!key) return false;
        const baseUrl = await apiClient.getBaseUrl();

        const newStatus = currentStatus === 'live' ? false : true;

        try {
            const response = await fetch(`${baseUrl}/api/admin/games/${gameId}/status`, {
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
        const baseUrl = await apiClient.getBaseUrl();

        try {
            const response = await fetch(`${baseUrl}/api/admin/games/${gameId}/toggle-featured`, {
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
