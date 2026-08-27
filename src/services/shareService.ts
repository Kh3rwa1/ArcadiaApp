import { Platform, Share } from 'react-native';
import { config } from '../config/environment';

// ═══════════════════════════════════════════════════════════════════════════
// Share Service — Native sharing with deep link generation
// ═══════════════════════════════════════════════════════════════════════════

const DEEP_LINK_BASE = 'https://arcadia.games';
const APP_SCHEME = 'arcadia';

export interface ShareContent {
  title: string;
  message: string;
  url: string;
}

export const shareService = {
  /**
   * Generate a deep link URL for a specific game
   */
  getGameDeepLink(gameId: string): string {
    return `${DEEP_LINK_BASE}/play/${gameId}`;
  },

  /**
   * Generate a challenge deep link with score
   */
  getChallengeDeepLink(gameId: string, score: number, challengerId: string): string {
    return `${DEEP_LINK_BASE}/challenge/${gameId}?score=${score}&from=${challengerId}`;
  },

  /**
   * Generate app scheme deep link (for installed app)
   */
  getAppSchemeLink(gameId: string): string {
    return `${APP_SCHEME}://game/${gameId}`;
  },

  /**
   * Share a game with native share sheet
   */
  async shareGame(gameTitle: string, gameId: string): Promise<boolean> {
    const url = this.getGameDeepLink(gameId);
    const content: ShareContent = {
      title: `Play ${gameTitle} on Arcadia`,
      message: `🎮 I'm playing ${gameTitle} on Arcadia — the infinite arcade!\n\nTry it now:`,
      url,
    };

    return this.nativeShare(content);
  },

  /**
   * Share a challenge (beat my score)
   */
  async shareChallenge(gameTitle: string, gameId: string, score: number, userId: string): Promise<boolean> {
    const url = this.getChallengeDeepLink(gameId, score, userId);
    const content: ShareContent = {
      title: `Beat my score in ${gameTitle}!`,
      message: `🏆 I scored ${score.toLocaleString()} in ${gameTitle} on Arcadia!\n\nCan you beat me?`,
      url,
    };

    return this.nativeShare(content);
  },

  /**
   * Share the app itself
   */
  async shareApp(): Promise<boolean> {
    const content: ShareContent = {
      title: 'Check out Arcadia',
      message: '🕹️ Arcadia is a TikTok-style arcade with 35+ instant games. No downloads needed!\n\nJoin me:',
      url: DEEP_LINK_BASE,
    };

    return this.nativeShare(content);
  },

  /**
   * Execute native share
   */
  async nativeShare(content: ShareContent): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: content.title,
            text: content.message,
            url: content.url,
          });
          return true;
        }
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${content.message}\n${content.url}`);
        return true;
      }

      const result = await Share.share({
        title: content.title,
        message: Platform.OS === 'ios'
          ? content.message
          : `${content.message}\n${content.url}`,
        url: Platform.OS === 'ios' ? content.url : undefined,
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      console.warn('[Share] Share failed:', error);
      return false;
    }
  },

  /**
   * Parse incoming deep link to extract game ID
   */
  parseDeepLink(url: string): { type: 'game' | 'challenge' | 'unknown'; gameId?: string; score?: number; from?: string } {
    try {
      // Handle app scheme: arcadia://game/{id}
      if (url.startsWith(`${APP_SCHEME}://`)) {
        const path = url.replace(`${APP_SCHEME}://`, '');
        const parts = path.split('/');
        if (parts[0] === 'game' && parts[1]) {
          return { type: 'game', gameId: parts[1] };
        }
      }

      // Handle web deep link: https://arcadia.games/play/{id}
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(Boolean);

      if (pathParts[0] === 'play' && pathParts[1]) {
        return { type: 'game', gameId: pathParts[1] };
      }

      if (pathParts[0] === 'challenge' && pathParts[1]) {
        return {
          type: 'challenge',
          gameId: pathParts[1],
          score: parseInt(parsed.searchParams.get('score') || '0', 10),
          from: parsed.searchParams.get('from') || undefined,
        };
      }
    } catch { }

    return { type: 'unknown' };
  },
};
