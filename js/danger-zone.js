(function (global) {
  'use strict';

  const MIN_ACTIVE_BALL_AGE_MS = 1450;

  function hasDangerOccupant(entities, gameTime, dangerLineY, maxLevel) {
    for (const entity of entities) {
      if (!entity?.body?.position || entity.level >= maxLevel || entity.special) continue;
      if (entity.state !== 'active' && entity.state !== 'merging') continue;
      const dangerBornAt = Number.isFinite(entity.dangerBornAt) ? entity.dangerBornAt : entity.bornAt;
      if (gameTime - dangerBornAt < MIN_ACTIVE_BALL_AGE_MS) continue;
      if (entity.body.position.y - entity.radius < dangerLineY) return true;
    }
    return false;
  }

  function createDangerTimer(durationMs) {
    let startedAt = null;

    function update(isOccupied, timeMs) {
      if (!isOccupied) {
        startedAt = null;
        return { occupied: false, startedAt, elapsedMs: 0, expired: false };
      }

      if (startedAt == null) startedAt = timeMs;
      const elapsedMs = Math.max(0, timeMs - startedAt);
      return { occupied: true, startedAt, elapsedMs, expired: elapsedMs >= durationMs };
    }

    function reset() {
      startedAt = null;
    }

    return Object.freeze({ update, reset });
  }

  global.DDMGameDangerZone = Object.freeze({ hasDangerOccupant, createDangerTimer });
})(window);
