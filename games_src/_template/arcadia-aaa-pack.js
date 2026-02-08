(() => {
  if (window.__arcadiaAAALoaded) return;
  window.__arcadiaAAALoaded = true;

  const gameId = (location.pathname.split('/').filter(Boolean).pop() || document.title || 'game')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const style = document.createElement('style');
  style.textContent = `
    body { position: relative; }
    .arcadia-cinematic-bg {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      background:
        radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.28), transparent 42%),
        radial-gradient(circle at 85% 10%, rgba(236, 72, 153, 0.22), transparent 46%),
        radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.16), transparent 44%);
      animation: arcadiaPulse 8s ease-in-out infinite alternate;
      mix-blend-mode: screen;
      opacity: .75;
    }
    .arcadia-vignette {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 3;
      box-shadow: inset 0 0 120px rgba(0,0,0,.48), inset 0 0 260px rgba(3, 7, 18, .9);
    }
    .arcadia-best-score {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 30;
      background: rgba(15, 23, 42, .55);
      border: 1px solid rgba(148, 163, 184, .32);
      color: #e2e8f0;
      font: 700 12px/1.2 Inter, system-ui, sans-serif;
      letter-spacing: .08em;
      padding: 9px 11px;
      border-radius: 999px;
      backdrop-filter: blur(8px);
      text-transform: uppercase;
      text-shadow: 0 0 12px rgba(59,130,246,.5);
    }
    .arcadia-tap-spark {
      position: fixed;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,.9), rgba(96,165,250,.1));
      pointer-events: none;
      z-index: 40;
      animation: arcadiaSpark .55s ease-out forwards;
      box-shadow: 0 0 18px rgba(96,165,250,.9);
    }
    #start-overlay { backdrop-filter: blur(7px); }
    @keyframes arcadiaPulse {
      from { transform: scale(1) translate3d(0,0,0); opacity: .58; }
      to { transform: scale(1.08) translate3d(0,-1.5%,0); opacity: .92; }
    }
    @keyframes arcadiaSpark {
      from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      to { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  const bg = document.createElement('div');
  bg.className = 'arcadia-cinematic-bg';
  const vignette = document.createElement('div');
  vignette.className = 'arcadia-vignette';
  document.body.append(bg, vignette);

  const bestKey = `arcadia_best_${gameId}`;
  const bestBadge = document.createElement('div');
  bestBadge.className = 'arcadia-best-score';
  let best = Number(localStorage.getItem(bestKey) || 0);
  const updateBest = () => (bestBadge.textContent = `Best ${best.toString().padStart(3, '0')}`);
  updateBest();
  document.body.appendChild(bestBadge);

  const sendTelemetry = (raw) => {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== 'object') return;
      if (parsed.type === 'GAMEPLAY' && parsed.action === 'SCORE_UPDATE') {
        const s = Number(parsed.payload?.score || 0);
        if (s > best) {
          best = s;
          localStorage.setItem(bestKey, String(best));
          updateBest();
        }
      }
      if (parsed.type === 'GAMEPLAY' && parsed.action === 'GAME_COMPLETE') {
        const s = Number(parsed.payload?.score || 0);
        if (s > best) {
          best = s;
          localStorage.setItem(bestKey, String(best));
          updateBest();
        }
      }
    } catch (_) {}
  };

  if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
    const original = window.ReactNativeWebView.postMessage.bind(window.ReactNativeWebView);
    window.ReactNativeWebView.postMessage = (msg) => {
      sendTelemetry(msg);
      return original(msg);
    };
  }

  const spark = (x, y) => {
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('span');
      dot.className = 'arcadia-tap-spark';
      const ox = (Math.random() - 0.5) * 30;
      const oy = (Math.random() - 0.5) * 30;
      dot.style.left = `${x + ox}px`;
      dot.style.top = `${y + oy}px`;
      document.body.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    }
  };

  window.addEventListener('pointerdown', (e) => spark(e.clientX, e.clientY), { passive: true });
})();
