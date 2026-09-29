(function (global) {
  'use strict';

  function createCharacterVisuals(options) {
    const {
      playerImageEl,
      playerFallbackEl,
      bossImageEl,
      bossFallbackEl,
      playerConfig,
      text
    } = options;
    const fallbackDelay = Math.max(0, Number(
      options.fallbackDelayMs ?? global.DDMGameConfig?.CHARACTER_IMAGE_FALLBACK_DELAY_MS ?? 1500
    ) || 0);
    const sourceCache = new Map();
    const requests = new WeakMap();

    function normalizeSource(source) {
      return typeof source === 'string' ? source.trim() : '';
    }

    function preloadSource(source) {
      const imageSource = normalizeSource(source);
      if (!imageSource) return Promise.resolve({ source: imageSource, status: 'error' });

      const cached = sourceCache.get(imageSource);
      if (cached) return cached.promise;

      let resolvePromise;
      const record = {
        source: imageSource,
        status: 'loading',
        promise: new Promise((resolve) => { resolvePromise = resolve; }),
        image: global.document.createElement('img')
      };
      sourceCache.set(imageSource, record);

      function finish(status) {
        if (record.status !== 'loading') return;
        record.status = status;
        record.image.onload = null;
        record.image.onerror = null;
        resolvePromise(record);
      }

      record.image.onload = () => finish('loaded');
      record.image.onerror = () => finish('error');
      record.image.src = imageSource;

      // A browser-cached image can already be complete before its load event runs.
      if (record.image.complete && record.image.naturalWidth > 0) finish('loaded');
      return record.promise;
    }

    function isCurrent(imageEl, request) {
      return requests.get(imageEl) === request;
    }

    function clearRequestTimer(request) {
      if (request.timer !== null) {
        global.clearTimeout(request.timer);
        request.timer = null;
      }
    }

    function showImage(imageEl, fallbackEl, request) {
      if (!isCurrent(imageEl, request)) return;
      clearRequestTimer(request);
      request.state = 'image';
      imageEl.hidden = false;
      fallbackEl.hidden = true;
    }

    function showFallback(imageEl, fallbackEl, request) {
      if (!isCurrent(imageEl, request)) return;
      clearRequestTimer(request);
      request.state = 'fallback';
      imageEl.hidden = true;
      fallbackEl.hidden = false;
    }

    function markSourceFailed(source) {
      const record = sourceCache.get(source);
      if (record) record.status = 'error';
    }

    function attachLoadedImage(imageEl, fallbackEl, request) {
      if (!isCurrent(imageEl, request)) return;

      imageEl.onload = () => showImage(imageEl, fallbackEl, request);
      imageEl.onerror = () => {
        if (!isCurrent(imageEl, request)) return;
        markSourceFailed(request.source);
        imageEl.onload = null;
        imageEl.onerror = null;
        showFallback(imageEl, fallbackEl, request);
      };

      if (imageEl.getAttribute('src') !== request.source) imageEl.src = request.source;
      if (imageEl.complete && imageEl.naturalWidth > 0) showImage(imageEl, fallbackEl, request);
    }

    function setImage(imageEl, fallbackEl, source, altText) {
      if (!imageEl || !fallbackEl) return;
      const imageSource = normalizeSource(source);
      imageEl.alt = altText;

      const previousRequest = requests.get(imageEl);
      if (previousRequest?.source === imageSource) {
        if (imageEl.complete && imageEl.naturalWidth > 0) {
          showImage(imageEl, fallbackEl, previousRequest);
        }
        return;
      }

      if (previousRequest) clearRequestTimer(previousRequest);
      imageEl.onload = null;
      imageEl.onerror = null;

      const request = {
        source: imageSource,
        state: 'loading',
        timer: null
      };
      requests.set(imageEl, request);
      imageEl.dataset.characterSource = imageSource;
      imageEl.hidden = true;
      fallbackEl.hidden = true;

      if (!imageSource) {
        imageEl.removeAttribute('src');
        showFallback(imageEl, fallbackEl, request);
        return;
      }

      request.timer = global.setTimeout(() => {
        if (!isCurrent(imageEl, request) || request.state !== 'loading') return;
        showFallback(imageEl, fallbackEl, request);
      }, fallbackDelay);

      const existingSrc = imageEl.getAttribute('src');
      if (existingSrc === imageSource && imageEl.complete && imageEl.naturalWidth > 0) {
        showImage(imageEl, fallbackEl, request);
        return;
      }

      const cached = sourceCache.get(imageSource);
      if (cached?.status === 'error') {
        showFallback(imageEl, fallbackEl, request);
        return;
      }

      preloadSource(imageSource).then((record) => {
        if (!isCurrent(imageEl, request)) return;
        if (record.status !== 'loaded') {
          showFallback(imageEl, fallbackEl, request);
          return;
        }
        attachLoadedImage(imageEl, fallbackEl, request);
      });
    }

    function setPlayer(config = playerConfig) {
      setImage(
        playerImageEl,
        playerFallbackEl,
        config?.image,
        text.get('player.visualAlt')
      );
    }

    function setBoss(boss) {
      setImage(
        bossImageEl,
        bossFallbackEl,
        boss?.image,
        text.get('boss.visualAlt')
      );
    }

    function preloadBoss(boss) {
      return preloadSource(boss?.image);
    }

    setPlayer();

    return Object.freeze({ setPlayer, setBoss, preloadBoss });
  }

  global.DDMGameCharacters = Object.freeze({ createCharacterVisuals });
})(window);
