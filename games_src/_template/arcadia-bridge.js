/**
 * ArcadiaBridge SDK v1.1
 * Standard bridge for all Arcadia games
 * 
 * Usage:
 * 1. Include this script in your game's HTML
 * 2. Call ArcadiaBridge.init() when your game loads
 * 3. Use the API methods to communicate with the host app
 */

const ArcadiaBridge = {
    version: '1.1',
    isReady: false,
    savedState: null,
    sessionStartTime: null,

    /**
     * Initialize the bridge and load saved state
     * Call this when your game assets are loaded
     */
    init() {
        // Load saved state from host config
        if (window.ARCADIA_CONFIG) {
            this.savedState = window.ARCADIA_CONFIG.savedState || null;
            console.log('[ArcadiaBridge] Loaded saved state:', this.savedState);
        }

        // Listen for host lifecycle events
        window.addEventListener('ArcadiaBridge', (event) => {
            const { action, payload } = event.detail || {};
            this.handleHostMessage(action, payload);
        });

        // Track session start time
        this.sessionStartTime = Date.now();

        // Send ready signal
        this.postMessage('HEARTBEAT_READY', {
            type: 'game',
            engine: 'canvas',
            hasState: !!this.savedState
        }, 'LIFECYCLE');

        this.isReady = true;
        console.log('[ArcadiaBridge] Initialized');
    },

    /**
     * Handle incoming messages from host app
     */
    handleHostMessage(action, payload) {
        switch (action) {
            case 'LIFECYCLE_PAUSE':
                console.log('[ArcadiaBridge] Paused');
                this.onPause?.();
                break;
            case 'LIFECYCLE_RESUME':
                console.log('[ArcadiaBridge] Resumed');
                this.onResume?.();
                break;
            case 'APP_RESTART':
                console.log('[ArcadiaBridge] Restart requested');
                this.onRestart?.();
                break;
            case 'AUDIO_CONTROL':
                console.log('[ArcadiaBridge] Audio control:', payload);
                this.onAudioControl?.(payload);
                break;
        }
    },

    /**
     * Get saved game state (level, score, unlocks, etc.)
     * @returns {Object|null} The saved state or null if new player
     */
    getSavedState() {
        return this.savedState;
    },

    /**
     * Save game state (will be synced to server)
     * @param {Object} state - The state to save (level, coins, unlocks, etc.)
     */
    saveState(state) {
        this.postMessage('STATE_UPDATE', {
            key: 'gameState',
            value: state
        }, 'GAMEPLAY');
    },

    /**
     * Report current score (for leaderboards)
     * @param {number} score - The current score
     * @param {number} level - The current level (optional)
     */
    reportScore(score, level = 1) {
        this.postMessage('STATE_UPDATE', {
            key: 'score',
            score: score,
            level: level
        }, 'GAMEPLAY');
    },

    /**
     * Report game flow started (user began playing)
     */
    flowStart() {
        this.postMessage('FLOW_START', {}, 'GAMEPLAY');
    },

    /**
     * Report game completed
     * @param {Object} result - Game result { score, level, status: 'win'|'lose'|'complete' }
     */
    complete(result) {
        const durationMs = this.sessionStartTime
            ? Date.now() - this.sessionStartTime
            : 0;

        this.postMessage('FLOW_COMPLETE', {
            ...result,
            duration_ms: durationMs,
            status: result.status || 'complete'
        }, 'GAMEPLAY');
    },

    /**
     * Trigger haptic feedback
     * @param {'impactLight'|'impactMedium'|'impactHeavy'|'notificationSuccess'|'notificationWarning'|'notificationError'} type
     */
    haptic(type = 'impactLight') {
        this.postMessage('UX_HAPTIC', { type }, 'UX');
    },

    /**
     * Report an error
     * @param {string} message - Error message
     */
    reportError(message) {
        this.postMessage('ERROR_REPORT', { message }, 'EVENT');
    },

    /**
     * Internal: Send message to host app
     */
    postMessage(action, payload = {}, type = 'GAMEPLAY') {
        const message = {
            version: this.version,
            type: type,
            action: action,
            payload: payload
        };

        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } else {
            // Web fallback (for development/testing)
            console.log('[ArcadiaBridge] Message:', message);
            window.parent?.postMessage(message, '*');
        }
    },

    // Callback hooks (override these in your game)
    onPause: null,      // () => void - Called when game should pause
    onResume: null,     // () => void - Called when game should resume
    onRestart: null,    // () => void - Called when game should restart
    onAudioControl: null // (payload: {muted, volume}) => void
};

// Auto-initialize when DOM is ready
if (document.readyState === 'complete') {
    ArcadiaBridge.init();
} else {
    window.addEventListener('load', () => ArcadiaBridge.init());
}

// Expose globally
window.ArcadiaBridge = ArcadiaBridge;
