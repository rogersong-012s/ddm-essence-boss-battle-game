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
    const failedSources = new WeakMap();

    function setImage(imageEl, fallbackEl, source, altText) {
      if (!imageEl || !fallbackEl) return;
      const imageSource = typeof source === 'string' ? source.trim() : '';
      imageEl.alt = altText;
      if (imageEl.dataset.characterSource === imageSource) return;

      imageEl.dataset.characterSource = imageSource;
      imageEl.hidden = true;
      fallbackEl.hidden = false;
      imageEl.onload = null;
      imageEl.onerror = null;
      imageEl.removeAttribute('src');

      if (!imageSource) return;
      const failed = failedSources.get(imageEl);
      if (failed?.has(imageSource)) return;

      imageEl.onload = () => {
        if (imageEl.dataset.characterSource !== imageSource) return;
        imageEl.hidden = false;
        fallbackEl.hidden = true;
      };
      imageEl.onerror = () => {
        if (imageEl.dataset.characterSource !== imageSource) return;
        const failures = failedSources.get(imageEl) || new Set();
        failures.add(imageSource);
        failedSources.set(imageEl, failures);
        imageEl.hidden = true;
        fallbackEl.hidden = false;
        imageEl.onload = null;
        imageEl.onerror = null;
        imageEl.removeAttribute('src');
      };
      imageEl.src = imageSource;
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

    setPlayer();

    return Object.freeze({ setPlayer, setBoss });
  }

  global.DDMGameCharacters = Object.freeze({ createCharacterVisuals });
})(window);
