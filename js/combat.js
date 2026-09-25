(function (global) {
  'use strict';

  function createCombatSystem(options) {
    const {
      config,
      bossTargetEl,
      bossHealthCardEl,
      bossNameEl,
      bossHpLabelEl,
      bossHpTrackEl,
      bossHpFillEl,
      bossHpValueEl,
      isPaused,
      schedule,
      formatNumber,
      onBossDefeated
    } = options;

    const bosses = Array.isArray(config.bosses) ? config.bosses : [];
    let currentBossIndex = 0;
    let bossCurrentHp = bosses[0]?.maxHp || 0;
    let mode = 'boss';
    let whiteScore = 0;
    let bossTransitioning = false;

    function updateUI() {
      const isWhiteScoreMode = mode === 'whiteScore';
      const currentBoss = bosses[currentBossIndex];
      const bossName = currentBoss ? `BOSS ${currentBoss.name}` : 'BOSS';
      bossNameEl.textContent = bossName;
      bossTargetEl.setAttribute('aria-label', `${bossName} 敵方目標`);
      bossHealthCardEl.classList.toggle('is-white-score', isWhiteScoreMode);
      bossHpLabelEl.textContent = isWhiteScoreMode ? 'WHITE SCORE' : 'BOSS HP';
      bossHpTrackEl.hidden = isWhiteScoreMode;
      bossHpTrackEl.setAttribute('aria-hidden', String(isWhiteScoreMode));
      bossHpValueEl.textContent = isWhiteScoreMode
        ? formatNumber(whiteScore)
        : `${formatNumber(bossCurrentHp)} / ${formatNumber(currentBoss?.maxHp || 0)}`;

      const healthRatio = currentBoss?.maxHp > 0 ? Math.max(0, Math.min(1, bossCurrentHp / currentBoss.maxHp)) : 0;
      bossHpFillEl.style.width = `${healthRatio * 100}%`;
      bossHpTrackEl.setAttribute('aria-valuemax', String(currentBoss?.maxHp || 0));
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

      if (mode === 'boss' && !bossTransitioning) dealBossDamage(appliedValue, impactEffect);
    }

    function dealBossDamage(damage, impactEffect = null) {
      const appliedDamage = Math.max(0, Number(damage) || 0);
      if (isPaused() || mode !== 'boss' || bossTransitioning || !appliedDamage || bossCurrentHp <= 0) return;

      bossCurrentHp = Math.max(0, bossCurrentHp - appliedDamage);
      updateUI();
      bossTargetEl.classList.remove('is-hit');
      void bossTargetEl.offsetWidth;
      bossTargetEl.classList.add('is-hit');
      schedule(() => bossTargetEl.classList.remove('is-hit'), config.hitReactionDuration);
      if (bossCurrentHp === 0) {
        bossTransitioning = true;
        const defeatedBoss = bosses[currentBossIndex];
        const isFinalBoss = currentBossIndex >= bosses.length - 1;
        onBossDefeated({
          defeatedBoss,
          nextBoss: isFinalBoss ? null : bosses[currentBossIndex + 1],
          isFinalBoss,
          impactEffect
        });
      }
    }

    function advanceBoss() {
      if (mode !== 'boss' || !bossTransitioning || currentBossIndex >= bosses.length - 1) return false;
      currentBossIndex += 1;
      bossCurrentHp = bosses[currentBossIndex].maxHp;
      bossTransitioning = false;
      updateUI();
      return true;
    }

    function continueAfterVictory() {
      if (mode !== 'boss' || !bossTransitioning || currentBossIndex !== bosses.length - 1 || bossCurrentHp !== 0) return false;
      bossTransitioning = false;
      mode = 'whiteScore';
      whiteScore = 0;
      updateUI();
      return true;
    }

    function reset() {
      currentBossIndex = 0;
      bossCurrentHp = bosses[0]?.maxHp || 0;
      mode = 'boss';
      whiteScore = 0;
      bossTransitioning = false;
      updateUI();
    }

    return Object.freeze({
      get bosses() { return bosses; },
      get currentBossIndex() { return currentBossIndex; },
      get currentBoss() { return bosses[currentBossIndex] || null; },
      get bossHp() { return bossCurrentHp; },
      get mode() { return mode; },
      get whiteScore() { return whiteScore; },
      get isBossTransitioning() { return bossTransitioning; },
      applyCombatValue,
      advanceBoss,
      continueAfterVictory,
      reset,
      updateUI
    });
  }

  global.DDMGameCombat = Object.freeze({ createCombatSystem });
})(window);
