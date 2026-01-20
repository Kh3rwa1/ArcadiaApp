import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_URL = 'arcadia_api_url';
const LOCAL_IP_FALLBACK = '192.168.0.101'; // Fallback for local dev

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'unknown';

export interface ApiError {
    message: string;
    type: 'network' | 'auth' | 'server' | 'unknown';
}

class ApiClient {
    private baseUrl: string = '';
    private isInitialized: boolean = false;

    constructor() {
        // Set default for web to relative path (proxy/same-origin)
        // For native, default to local IP
        this.baseUrl = Platform.OS === 'web' ? '' : `http://${LOCAL_IP_FALLBACK}:8000`;
    }

    /**
     * Initialize the client by loading the stored URL
     */
    async init() {
        if (this.isInitialized) return;
        try {
            const storedUrl = await AsyncStorage.getItem(STORAGE_KEY_URL);
            if (storedUrl) {
                this.baseUrl = storedUrl.replace(/\/$/, ''); // Remove trailing slash
            }
            this.isInitialized = true;
        } catch (e) {
            console.warn('ApiClient init failed', e);
        }
    }

    /**
     * Get the current base URL
     */
    async getBaseUrl(): Promise<string> {
        if (!this.isInitialized) await this.init();
        return this.baseUrl;
    }

    /**
     * Set a new base URL and persist it
     */
    async setBaseUrl(url: string) {
        const cleanUrl = url.replace(/\/$/, '');
        this.baseUrl = cleanUrl;
        this.isInitialized = true;
        await AsyncStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    }

    /**
     * Check if the server is reachable
     */
    async checkHealth(): Promise<boolean> {
        if (!this.isInitialized) await this.init();
        try {
            // Ping a lightweight endpoint, e.g., root or explicit health check
            // Using /api/admin/games creates a 403 (Auth) or 200 (OK) which both mean "Connected"
            // compared to Network Error which means "Disconnected"
            console.log(`[ApiClient] Checking health at ${this.baseUrl || 'relative path'}`);

            // Timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.baseUrl}/api/health-check`, { // Ideally backend has this
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            }).catch(async () => {
                // Fallback: Try fetching games endpoint just to see connectivity (will likely 401/403 but that means Alive)
                return await fetch(`${this.baseUrl}/api/admin/games`, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
            });

            clearTimeout(timeoutId);

            // If we get specific status codes, we are connected
            return response.status < 500;
        } catch (e) {
            console.log('[ApiClient] Health check failed:', e);
            return false;
        }
    }

    /**
     * Validates a URL string
     */
    isValidUrl(url: string): boolean {
        try {
            // Allow empty string for relative paths on web
            if (url === '' && Platform.OS === 'web') return true;
            new URL(url);
            return url.startsWith('http');
        } catch {
            return false;
        }
    }
}

export const apiClient = new ApiClient();
