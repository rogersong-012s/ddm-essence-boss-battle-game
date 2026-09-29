(function (global, document) {
  'use strict';

  const BREAKPOINT = 900;
  const coarsePointer = global.matchMedia?.('(pointer: coarse)');
  const landscapeQuery = global.matchMedia?.('(orientation: landscape)');
  let mode = 'desktop';
  let landscape = false;
  let lastWidth = global.innerWidth;
  let lastHeight = global.innerHeight;
  let bossHealthPlaceholder = null;
  let bossHealthPlaceholderBaseHeight = 0;
  let bossHealthPlaceholderBaseWidth = 0;

  function hasTouchInput() {
    return Boolean(coarsePointer?.matches || (global.navigator?.maxTouchPoints || 0) > 0);
  }

  function detectMode() {
    const narrowViewport = global.innerWidth <= BREAKPOINT;
    const shortTouchLandscape = global.innerHeight <= 520 && hasTouchInput();
    return narrowViewport || shortTouchLandscape ? 'mobile' : 'desktop';
  }

  function applyClasses() {
    const roots = [document.documentElement, document.body].filter(Boolean);
    for (const root of roots) {
      root.classList.toggle('mobile-ui', mode === 'mobile');
      root.classList.toggle('desktop-ui', mode === 'desktop');
      root.classList.toggle('mobile-landscape', landscape);
    }
    const orientationNotice = document.querySelector('#orientation-warning');
    if (orientationNotice) orientationNotice.hidden = !landscape;
  }

  function syncBossHealthCardLayout(nextMode = mode) {
    const bossTarget = document.querySelector('#boss-target');
    const rightPanel = document.querySelector('.right-panel');
    const healthCard = document.querySelector('#boss-health-card');
    if (!bossTarget || !rightPanel || !healthCard) return;

    if (nextMode === 'mobile') {
      if (healthCard.parentElement === bossTarget) {
        const frame = document.querySelector('.game-wrapper');
        const cardRect = healthCard.getBoundingClientRect();
        const placeholder = document.createElement('div');
        placeholder.className = 'boss-health-mobile-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        bossTarget.insertBefore(placeholder, healthCard);
        bossHealthPlaceholder = placeholder;
        bossHealthPlaceholderBaseHeight = cardRect.height;
        bossHealthPlaceholderBaseWidth = frame?.getBoundingClientRect().width || cardRect.width;
        const maxRule = rightPanel.querySelector('.max-rule-card');
        rightPanel.insertBefore(healthCard, maxRule || null);
      }

      if (bossHealthPlaceholder && bossHealthPlaceholderBaseWidth > 0) {
        const frameWidth = document.querySelector('.game-wrapper')?.getBoundingClientRect().width;
        if (frameWidth) {
          bossHealthPlaceholder.style.height = `${bossHealthPlaceholderBaseHeight * frameWidth / bossHealthPlaceholderBaseWidth}px`;
        }
      }
      return;
    }

    if (healthCard.parentElement === rightPanel) {
      const visual = bossTarget.querySelector('.boss-visual');
      bossTarget.insertBefore(healthCard, bossHealthPlaceholder || visual || null);
    }
    bossHealthPlaceholder?.remove();
    bossHealthPlaceholder = null;
    bossHealthPlaceholderBaseHeight = 0;
    bossHealthPlaceholderBaseWidth = 0;
  }

  function refresh() {
    const previousMode = mode;
    const previousLandscape = landscape;
    lastWidth = global.innerWidth;
    lastHeight = global.innerHeight;
    mode = detectMode();
    landscape = mode === 'mobile' && global.innerWidth > global.innerHeight;
    applyClasses();
    syncBossHealthCardLayout(mode);

    if (mode !== previousMode) {
      global.dispatchEvent(new CustomEvent('ddm-ui-mode-change', {
        detail: { mode, previousMode }
      }));
    }
    if (landscape !== previousLandscape) {
      global.dispatchEvent(new CustomEvent('ddm-orientation-change', {
        detail: { landscape }
      }));
    }
  }

  mode = detectMode();
  landscape = mode === 'mobile' && global.innerWidth > global.innerHeight;
  applyClasses();
  document.addEventListener('DOMContentLoaded', () => {
    applyClasses();
    syncBossHealthCardLayout(mode);
    const gameFrame = document.querySelector('.game-wrapper');
    if (gameFrame && 'ResizeObserver' in global) new ResizeObserver(refresh).observe(gameFrame);
  }, { once: true });
  global.addEventListener('resize', refresh, { passive: true });
  global.addEventListener('orientationchange', refresh, { passive: true });
  global.visualViewport?.addEventListener('resize', refresh, { passive: true });
  coarsePointer?.addEventListener?.('change', refresh);
  landscapeQuery?.addEventListener?.('change', refresh);
  if ('ResizeObserver' in global) {
    new ResizeObserver(refresh).observe(document.documentElement);
  }
  global.setInterval(() => {
    if (global.innerWidth !== lastWidth || global.innerHeight !== lastHeight) refresh();
  }, 250);

  global.DDMMobileUI = Object.freeze({
    breakpoint: BREAKPOINT,
    getMode: () => mode,
    isMobile: () => mode === 'mobile',
    isLandscape: () => landscape,
    hasCoarsePointer: hasTouchInput
  });
})(window, document);
