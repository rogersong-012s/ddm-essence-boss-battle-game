(function (global) {
  'use strict';

  function createCombatSystem(options) {
    const {
      config,
      bossTargetEl,
      bossHealthCardEl,
      bossHpLabelEl,
      bossHpTrackEl,
      bossHpFillEl,
      bossHpValueEl,
      isPaused,
      schedule,
      formatNumber,
      onBossDefeated
    } = options;

    let bossCurrentHp = config.maxHp;
    let mode = 'boss';
    let whiteScore = 0;

    function updateUI() {
      const isWhiteScoreMode = mode === 'whiteScore';
      bossHealthCardEl.classList.toggle('is-white-score', isWhiteScoreMode);
      bossHpLabelEl.textContent = isWhiteScoreMode ? 'WHITE SCORE' : 'BOSS HP';
      bossHpTrackEl.hidden = isWhiteScoreMode;
      bossHpTrackEl.setAttribute('aria-hidden', String(isWhiteScoreMode));
      bossHpValueEl.textContent = isWhiteScoreMode
        ? formatNumber(whiteScore)
        : `${formatNumber(bossCurrentHp)} / ${formatNumber(config.maxHp)}`;

      const healthRatio = config.maxHp > 0 ? Math.max(0, Math.min(1, bossCurrentHp / config.maxHp)) : 0;
      bossHpFillEl.style.width = `${healthRatio * 100}%`;
      bossHpTrackEl.setAttribute('aria-valuemax', String(config.maxHp));
      bossHpTrackEl.setAttribute('aria-valuenow', String(bossCurrentHp));
      bossTargetEl.classList.toggle('is-defeated', bossCurrentHp <= 0);
    }

    function applyCombatValue(amount, source, impactEffect = null) {
      const appliedValue = Math.max(0, Number(amount) || 0);
      if (isPaused() || !appliedValue) return;
      if (impactEffect && source) impactEffect.dataset.combatSource = source;

      if (mode === 'whiteScore') {
        whiteScore += appliedValue;
        updateUI();
        return;
      }

      if (mode === 'boss') dealBossDamage(appliedValue, impactEffect);
    }

    function dealBossDamage(damage, impactEffect = null) {
      const appliedDamage = Math.max(0, Number(damage) || 0);
      if (isPaused() || mode !== 'boss' || !appliedDamage || bossCurrentHp <= 0) return;

      bossCurrentHp = Math.max(0, bossCurrentHp - appliedDamage);
      updateUI();
      bossTargetEl.classList.remove('is-hit');
      void bossTargetEl.offsetWidth;
      bossTargetEl.classList.add('is-hit');
      schedule(() => bossTargetEl.classList.remove('is-hit'), config.hitReactionDuration);
      if (bossCurrentHp === 0) onBossDefeated(impactEffect);
    }

    function continueAfterVictory() {
      mode = 'whiteScore';
      whiteScore = 0;
      updateUI();
    }

    function reset() {
      bossCurrentHp = config.maxHp;
      mode = 'boss';
      whiteScore = 0;
      updateUI();
    }

    return Object.freeze({
      get maxHp() { return config.maxHp; },
      get bossHp() { return bossCurrentHp; },
      get mode() { return mode; },
      get whiteScore() { return whiteScore; },
      applyCombatValue,
      continueAfterVictory,
      reset,
      updateUI
    });
  }

  global.DDMGameCombat = Object.freeze({ createCombatSystem });
})(window);
