(function (global) {
  'use strict';

  function createPlayerProgression(config, playerNameEl) {
    let playerLevel = 0;

    function getBallScale() {
      const maxLevel = Math.max(0, Math.floor(Number(config.PLAYER_MAX_LEVEL) || 0));
      const reductionPerLevel = Math.max(0, Number(config.BALL_SIZE_REDUCTION_PER_PLAYER_LEVEL) || 0);
      const cappedLevel = Math.min(playerLevel, maxLevel);
      return Math.max(0, 1 - cappedLevel * reductionPerLevel);
    }

    function updatePlayerName(animate = false) {
      if (!playerNameEl) return;
      playerNameEl.textContent = `DDM守衛+${playerLevel}`;
      if (!playerNameEl.classList) return;
      playerNameEl.classList.remove('is-leveling-up');
      if (animate) {
        void playerNameEl.offsetWidth;
        playerNameEl.classList.add('is-leveling-up');
      }
    }

    function levelUp() {
      const maxLevel = Math.max(0, Math.floor(Number(config.PLAYER_MAX_LEVEL) || 0));
      if (playerLevel >= maxLevel) return false;
      playerLevel = Math.min(maxLevel, playerLevel + 1);
      updatePlayerName(true);
      return true;
    }

    function reset() {
      playerLevel = 0;
      updatePlayerName();
    }

    updatePlayerName();

    return Object.freeze({
      get level() { return playerLevel; },
      getBallScale,
      getScaledRadius(baseRadius) { return Math.max(0, Number(baseRadius) || 0) * getBallScale(); },
      levelUp,
      reset
    });
  }

  global.DDMGameProgression = Object.freeze({ createPlayerProgression });
})(window);
