(function (global) {
  'use strict';

  function createBallSizeManager(options) {
    const { Body, getEntities, getBaseRadius, getPlayerScale } = options;

    function getScaledRadius(level) {
      return getBaseRadius(level) * getPlayerScale();
    }

    function resizeAllBalls() {
      const playerScale = getPlayerScale();
      let resizedCount = 0;

      for (const entity of getEntities().values()) {
        const body = entity?.body;
        if (!body || !Number.isFinite(entity.baseRadius) || !Number.isFinite(entity.radius)) continue;

        const targetRadius = entity.baseRadius * playerScale;
        const scaleFactor = targetRadius / entity.radius;
        if (!(targetRadius > 0) || !Number.isFinite(scaleFactor) || Math.abs(scaleFactor - 1) < 1e-12) continue;

        const position = { x: body.position.x, y: body.position.y };
        const velocity = { x: body.velocity.x, y: body.velocity.y };
        const angularVelocity = body.angularVelocity;

        Body.scale(body, scaleFactor, scaleFactor);
        Body.setPosition(body, position);
        if (!body.isStatic) {
          Body.setVelocity(body, velocity);
          Body.setAngularVelocity(body, angularVelocity);
        }
        entity.radius = targetRadius;
        resizedCount += 1;
      }

      return resizedCount;
    }

    return Object.freeze({ getScaledRadius, resizeAllBalls });
  }

  global.DDMGameBallSizes = Object.freeze({ createBallSizeManager });
})(window);
