(function (global) {
  'use strict';

  function createAttackEffects(options) {
    const {
      BOSS_CONFIG, attackEffectsEl, bossCoreEl, playerAttackOriginEl,
      getLayoutMetrics, getGameMode, getBossHp, isPaused,
      formatNumber, schedule, applyCombatValue, clamp
    } = options;
    const activeAttackEffects = new Set();
    const activeAttackAnimations = new Map();

    function cancelUnresolvedBossAttacks(exceptEffect = null) {
      for (const effect of [...activeAttackEffects]) {
        if (effect === exceptEffect) continue;
        const intervalId = activeAttackAnimations.get(effect);
        if (intervalId != null) clearInterval(intervalId);
        activeAttackAnimations.delete(effect);
        effect.remove();
        activeAttackEffects.delete(effect);
      }
    }

    function playPlayerAttackEffect(damage, source = 'merge') {
      if (!damage || isPaused() || (getGameMode() === 'boss' && getBossHp() <= 0)) return;
      const { frameRect, scaleX, scaleY } = getLayoutMetrics();
      const bossRect = bossCoreEl.getBoundingClientRect();
      const playerOriginRect = playerAttackOriginEl.getBoundingClientRect();
      if (!frameRect.width || !scaleX || !scaleY || !bossRect.width || !bossRect.height || !playerOriginRect.width || !playerOriginRect.height) return;

      const startX = (playerOriginRect.left + playerOriginRect.width / 2 - frameRect.left) / scaleX;
      const startY = (playerOriginRect.top + playerOriginRect.height / 2 - frameRect.top) / scaleY;
      const endX = (bossRect.left + bossRect.width / 2 - frameRect.left) / scaleX;
      const endY = (bossRect.top + bossRect.height / 2 - frameRect.top) / scaleY;
      const distance = Math.hypot(endX - startX, endY - startY);
      const curveAmount = Math.min(72, Math.max(26, distance * 0.14));
      const normalX = distance ? -(endY - startY) / distance : 0;
      const normalY = distance ? (endX - startX) / distance : -1;
      const controlX = (startX + endX) / 2 + normalX * curveAmount;
      const controlY = (startY + endY) / 2 + normalY * curveAmount;
      const travelPath = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
      const effect = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      effect.classList.add('boss-attack-effect');
      effect.classList.add(source === 'ddm' ? 'attack-source-ddm' : source === 'drop' ? 'attack-source-drop' : 'attack-source-merge');

      const trajectory = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      trajectory.classList.add('meteor-trajectory');
      trajectory.setAttribute('d', travelPath);
      effect.append(trajectory);

      const projectile = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      projectile.classList.add('meteor-projectile');
      const flight = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      flight.classList.add('meteor-flight');

      const tail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tail.classList.add('meteor-tail');
      tail.setAttribute('d', 'M 7 -5 C -18 -13 -54 -25 -102 -17 C -78 -4 -44 8 5 7 Z');
      flight.append(tail);
      const innerTail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      innerTail.classList.add('meteor-tail-inner');
      innerTail.setAttribute('d', 'M 5 -2 C -21 -7 -46 -13 -74 -12 C -51 -4 -22 2 5 3 Z');
      flight.append(innerTail);
      const coreGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      coreGlow.classList.add('meteor-core-glow');
      coreGlow.setAttribute('r', '24');
      flight.append(coreGlow);
      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.classList.add('meteor-core');
      core.setAttribute('r', '6.5');
      flight.append(core);
      const spark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      spark.classList.add('meteor-spark');
      spark.setAttribute('d', 'm 0 -13 2.2 10.8 10.8 2.2-10.8 2.2L0 13-2.2 2.2-13 0l10.8-2.2Z');
      flight.append(spark);
      projectile.append(flight);
      effect.append(projectile);

      const impact = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      impact.classList.add('boss-hit-burst');
      impact.setAttribute('cx', String(endX));
      impact.setAttribute('cy', String(endY));
      impact.setAttribute('r', '22');
      effect.append(impact);

      const damageLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      damageLabel.classList.add('boss-attack-damage');
      damageLabel.setAttribute('x', String(endX));
      damageLabel.setAttribute('y', String(endY - 28));
      damageLabel.setAttribute('text-anchor', 'middle');
      damageLabel.textContent = `${getGameMode() === 'whiteScore' ? '+' : '−'}${formatNumber(damage)}`;
      effect.append(damageLabel);

      attackEffectsEl.append(effect);
      activeAttackEffects.add(effect);
      animateMeteorFlight(flight, effect, startX, startY, controlX, controlY, endX, endY);
      schedule(() => {
        if (!effect.isConnected) return;
        const intervalId = activeAttackAnimations.get(effect);
        if (intervalId != null) {
          clearInterval(intervalId);
          activeAttackAnimations.delete(effect);
        }
        const impactAngle = Math.atan2(endY - controlY, endX - controlX) * 180 / Math.PI;
        flight.setAttribute('transform', `translate(${endX} ${endY}) rotate(${impactAngle})`);
        effect.classList.add('is-impact');
        applyCombatValue(damage, source, effect);
        schedule(() => {
          const remainingInterval = activeAttackAnimations.get(effect);
          if (remainingInterval != null) {
            clearInterval(remainingInterval);
            activeAttackAnimations.delete(effect);
          }
          effect.remove();
          activeAttackEffects.delete(effect);
        }, BOSS_CONFIG.impactDuration);
      }, BOSS_CONFIG.projectileTravelDuration);
    }

    function animateMeteorFlight(flight, effect, startX, startY, controlX, controlY, endX, endY) {
      const startedAt = performance.now();
      const duration = BOSS_CONFIG.projectileTravelDuration;
      let intervalId = null;

      const updateFlight = () => {
        if (!effect.isConnected) {
          clearInterval(intervalId);
          activeAttackAnimations.delete(effect);
          return;
        }
        const progress = clamp((performance.now() - startedAt) / duration, 0, 1);
        const inverse = 1 - progress;
        const x = inverse * inverse * startX + 2 * inverse * progress * controlX + progress * progress * endX;
        const y = inverse * inverse * startY + 2 * inverse * progress * controlY + progress * progress * endY;
        const tangentX = 2 * inverse * (controlX - startX) + 2 * progress * (endX - controlX);
        const tangentY = 2 * inverse * (controlY - startY) + 2 * progress * (endY - controlY);
        const angle = Math.atan2(tangentY, tangentX) * 180 / Math.PI;
        flight.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`);

        if (progress >= 1) {
          clearInterval(intervalId);
          activeAttackAnimations.delete(effect);
        }
      };

      flight.setAttribute('transform', `translate(${startX} ${startY})`);
      intervalId = setInterval(updateFlight, 1000 / 60);
      activeAttackAnimations.set(effect, intervalId);
    }

    function clearBossAttackEffects() {
      for (const intervalId of activeAttackAnimations.values()) clearInterval(intervalId);
      activeAttackAnimations.clear();
      for (const effect of activeAttackEffects) effect.remove();
      activeAttackEffects.clear();
      attackEffectsEl.replaceChildren();
    }

    return Object.freeze({ playPlayerAttackEffect, cancelUnresolvedBossAttacks, clearBossAttackEffects });
  }

  global.DDMGameEffects = Object.freeze({ createAttackEffects });
})(window);
