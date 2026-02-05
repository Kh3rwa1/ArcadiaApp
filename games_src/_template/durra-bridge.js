/**
 * DURRA Bridge SDK v1.2
 * Standard bridge for all DURRA immersive experiences.
 */

const DURRA_Bridge = {
    version: '1.2',
    isReady: false,
    savedState: null,
    sessionStartTime: null,

    init() {
        if (window.DURRA_CONFIG) {
            this.savedState = window.DURRA_CONFIG.savedState || null;
            console.log('[DURRA_Bridge] Loaded state:', this.savedState);
        }

        window.addEventListener('DURRA_Bridge', (event) => {
            const { action, payload } = event.detail || {};
            this.handleHostMessage(action, payload);
        });

        this.sessionStartTime = Date.now();

        this.postMessage('HEARTBEAT_READY', {
            type: 'game',
            engine: 'canvas',
            hasState: !!this.savedState
        }, 'LIFECYCLE');

        this.isReady = true;
        console.log('[DURRA_Bridge] Initialized');
    },

    handleHostMessage(action, payload) {
        switch (action) {
            case 'LIFECYCLE_PAUSE':
                this.onPause?.();
                break;
            case 'LIFECYCLE_RESUME':
                this.onResume?.();
                break;
            case 'APP_RESTART':
                this.onRestart?.();
                break;
            case 'AUDIO_CONTROL':
                this.onAudioControl?.(payload);
                break;
        }
    },

    getSavedState() {
        return this.savedState;
    },

    saveState(state) {
        this.postMessage('STATE_UPDATE', { key: 'gameState', value: state }, 'GAMEPLAY');
    },

    reportScore(score, level = 1) {
        this.postMessage('STATE_UPDATE', { key: 'score', score, level }, 'GAMEPLAY');
    },

    flowStart() {
        this.postMessage('FLOW_START', {}, 'GAMEPLAY');
    },

    complete(result) {
        const durationMs = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
        this.postMessage('FLOW_COMPLETE', { ...result, duration_ms: durationMs }, 'GAMEPLAY');
    },

    haptic(type = 'impactLight') {
        this.postMessage('UX_HAPTIC', { type }, 'UX');
    },

    postMessage(action, payload = {}, type = 'GAMEPLAY') {
        const message = { version: this.version, type, action, payload };
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } else {
            window.parent?.postMessage(message, '*');
        }
    },

    onPause: null,
    onResume: null,
    onRestart: null,
    onAudioControl: null
};

if (document.readyState === 'complete') {
    DURRA_Bridge.init();
} else {
    window.addEventListener('load', () => DURRA_Bridge.init());
}

window.DURRA_Bridge = DURRA_Bridge;
