import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from './api';

// Re-use the base configuration from api.ts logic (simplified here)
// In a real scenario, we'd export API_BASE from api.ts or use a shared config
const TUNNEL_URL = 'https://arcadia-api-2025.loca.lt';
const LOCAL_IP = '192.168.0.101';

const API_BASE = Platform.OS === 'web'
    ? ''
    : `http://${LOCAL_IP}:8000`;

const STORAGE_KEY = 'arcadia_admin_key';

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
     * Verify if we have a stored admin key
     */
    async hasKey(): Promise<boolean> {
        const key = await AsyncStorage.getItem(STORAGE_KEY);
        return !!key;
    },

    /**
     * Save key and validate against backend
     */
    async login(key: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/admin/games`, {
                headers: {
                    'X-Arcadia-Admin-Key': key,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                await AsyncStorage.setItem(STORAGE_KEY, key);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Admin login failed:', e);
            return false;
        }
    },

    /**
     * Logout (clear key)
     */
    async logout(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    },

    /**
     * Get list of games
     */
    async getGames(): Promise<AdminGame[]> {
        const key = await AsyncStorage.getItem(STORAGE_KEY);
        if (!key) throw new Error('No admin key');

        const response = await fetch(`${API_BASE}/api/admin/games`, {
            headers: {
                'X-Arcadia-Admin-Key': key,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Fetch failed');
        return await response.json();
    },

    /**
     * Toggle game status (Live <-> Hidden)
     */
    async toggleStatus(gameId: string, currentStatus: string): Promise<boolean> {
        const key = await AsyncStorage.getItem(STORAGE_KEY);
        if (!key) return false;

        const newStatus = currentStatus === 'live' ? false : true; // API expects boolean is_active

        try {
            const response = await fetch(`${API_BASE}/api/admin/games/${gameId}/status`, {
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

    /**
     * Toggle featured status
     */
    async toggleFeatured(gameId: string): Promise<boolean> {
        const key = await AsyncStorage.getItem(STORAGE_KEY);
        if (!key) return false;

        try {
            const response = await fetch(`${API_BASE}/api/admin/games/${gameId}/toggle-featured`, {
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
