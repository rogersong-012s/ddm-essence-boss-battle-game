(function (global, document) {
  'use strict';

  const BREAKPOINT = 900;
  const coarsePointer = global.matchMedia?.('(pointer: coarse)');
  const landscapeQuery = global.matchMedia?.('(orientation: landscape)');
  let mode = 'desktop';
  let landscape = false;
  let lastWidth = global.innerWidth;
  let lastHeight = global.innerHeight;

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

  function refresh() {
    const previousMode = mode;
    const previousLandscape = landscape;
    lastWidth = global.innerWidth;
    lastHeight = global.innerHeight;
    mode = detectMode();
    landscape = mode === 'mobile' && global.innerWidth > global.innerHeight;
    applyClasses();

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
