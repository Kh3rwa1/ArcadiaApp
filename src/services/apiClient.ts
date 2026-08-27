import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBase } from '../config/environment';

const STORAGE_KEY_URL = 'durra_api_url';

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'unknown';

class ApiClient {
    private baseUrl: string = '';
    private isInitialized: boolean = false;

    constructor() {
        this.baseUrl = getApiBase();
    }

    async init() {
        if (this.isInitialized) return;
        try {
            const storedUrl = await AsyncStorage.getItem(STORAGE_KEY_URL);
            if (storedUrl) {
                this.baseUrl = storedUrl.replace(/\/$/, '');
            }
            this.isInitialized = true;
        } catch {
            this.isInitialized = true;
        }
    }

    async getBaseUrl(): Promise<string> {
        if (!this.isInitialized) await this.init();
        return this.baseUrl;
    }

    async setBaseUrl(url: string) {
        const cleanUrl = url.replace(/\/$/, '');
        this.baseUrl = cleanUrl;
        this.isInitialized = true;
        await AsyncStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    }

    async checkHealth(): Promise<boolean> {
        if (!this.isInitialized) await this.init();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.baseUrl}/api/health-check`, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeoutId);
            return response.status >= 200 && response.status < 500;
        } catch {
            return false;
        }
    }

    isValidUrl(url: string): boolean {
        try {
            if (url === '') return true;
            new URL(url);
            return url.startsWith('http');
        } catch {
            return false;
        }
    }
}

export const apiClient = new ApiClient();
