(function (global) {
  'use strict';

  function createRenderer(options) {
    const { canvas, ctx, nextPreviewCanvas, nextPreviewCtx, config, getState, clamp } = options;
    const MAX_LEVEL = config.LAYOUT.ballDiameterRatios.length - 1;
    const {
      LOGICAL_WIDTH, LOGICAL_HEIGHT, GAME_LEFT, GAME_RIGHT, GAME_TOP, GAME_FLOOR, DROP_Y,
      PLAYFIELD_BOTTOM, WALL_THICKNESS, BOWL_SIDE_PADDING, BOWL_TOP_PADDING,
      DANGER_LABEL_FONT_SIZE, DDM_FADE_DURATION, MAX_PRESENTATION_DURATION, MERGE_DELAY
    } = config;
    let {
      gameTime, dangerSince, dangerLineWarning, particles, entities, activeSkill, gamePaused,
      currentLevel, currentDropX, nextLevel, MELANIN_LEVELS, DANGER_LINE_Y
    } = getState();

    function syncState() {
      ({
        gameTime, dangerSince, dangerLineWarning, particles, entities, activeSkill, gamePaused,
        currentLevel, currentDropX, nextLevel, MELANIN_LEVELS, DANGER_LINE_Y
      } = getState());
    }

    function resizeNextPreview() {
      if (!nextPreviewCanvas || !nextPreviewCtx) return;
      const rect = nextPreviewCanvas.getBoundingClientRect();
      const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      nextPreviewCanvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
      nextPreviewCanvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
      nextPreviewCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function draw() {
      syncState();
      ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      drawBackgroundAccents();
      drawBowl();
      drawParticles();
      drawEntities();
      drawDropPreview();
      drawNextPreview();
    }

    function drawNextPreview() {
      if (!nextPreviewCtx || !nextPreviewCanvas || !MELANIN_LEVELS[nextLevel]) return;
      const width = nextPreviewCanvas.clientWidth;
      const height = nextPreviewCanvas.clientHeight;
      if (!width || !height) return;
      nextPreviewCtx.clearRect(0, 0, width, height);
      const radius = Math.min(MELANIN_LEVELS[nextLevel].diameter / 2, Math.min(width, height) * .3);
      drawMelanin(width / 2, height / 2, nextLevel, radius, 1, 1, false, 0, nextPreviewCtx);
    }

    function drawBackgroundAccents() {
      ctx.save();
      ctx.globalAlpha = 0.28;
      for (let i = 0; i < 9; i += 1) {
        const x = 330 + i * 122;
        const y = 160 + (i % 3) * 22;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 2), 0, Math.PI * 2);
        ctx.fillStyle = i % 2 ? '#efd6c5' : '#c6e5d7';
        ctx.fill();
      }
      ctx.restore();
    }

    function drawBowl() {
      const left = GAME_LEFT - BOWL_SIDE_PADDING;
      const right = GAME_RIGHT + BOWL_SIDE_PADDING;
      const top = GAME_TOP - BOWL_TOP_PADDING;
      const bottom = PLAYFIELD_BOTTOM;
      const width = right - left;
      const height = bottom - top;

      ctx.save();
      ctx.shadowColor = 'rgba(129, 99, 82, .12)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 12;
      roundedRect(ctx, left, top, width, height, 34);
      const glass = ctx.createLinearGradient(left, top, right, bottom);
      glass.addColorStop(0, 'rgba(242,253,255,.58)');
      glass.addColorStop(.48, 'rgba(225,248,248,.34)');
      glass.addColorStop(1, 'rgba(218,245,218,.35)');
      ctx.fillStyle = glass;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(80, 157, 154, .72)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      roundedRect(ctx, left, top, width, height, 34);
      ctx.clip();
      const inner = ctx.createLinearGradient(left, top, right, bottom);
      inner.addColorStop(0, 'rgba(243,253,255,.16)');
      inner.addColorStop(1, 'rgba(205,238,208,.2)');
      ctx.fillStyle = inner;
      ctx.fillRect(left, top, width, height);

      // A few quiet bubbles make the play area feel like a clear glass dish.
      for (let i = 0; i < 14; i += 1) {
        const x = left + 50 + ((i * 197) % (width - 100));
        const y = top + 82 + ((i * 113) % (height - 150));
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.38)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Glass rim, sides, and cushioned floor are decorative counterparts of the Matter.js walls.
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,.91)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(left + 28, top + 7);
      ctx.lineTo(right - 28, top + 7);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(169,218,204,.86)';
      ctx.beginPath();
      ctx.moveTo(GAME_LEFT, top + 24);
      ctx.lineTo(GAME_LEFT, GAME_FLOOR - 6);
      ctx.moveTo(GAME_RIGHT, top + 24);
      ctx.lineTo(GAME_RIGHT, GAME_FLOOR - 6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.76)';
      roundedRect(ctx, GAME_LEFT - 6, GAME_FLOOR - 6, GAME_RIGHT - GAME_LEFT + 12, 18, 9);
      ctx.fill();
      ctx.restore();

      drawDangerLine();
    }

    function drawDangerLine() {
      ctx.save();
      const warningFlash = dangerLineWarning && dangerSince != null
        && Math.floor((gameTime - dangerSince) / 300) % 2 === 1;
      ctx.globalAlpha = 1;
      ctx.setLineDash([9, 10]);
      ctx.lineWidth = warningFlash ? 4 : 2;
      ctx.strokeStyle = warningFlash ? '#ff3b30' : 'rgba(225, 124, 99, .82)';
      if (warningFlash) {
        ctx.shadowColor = 'rgba(255, 59, 48, .8)';
        ctx.shadowBlur = 9;
      }
      ctx.beginPath();
      ctx.moveTo(GAME_LEFT + 18, DANGER_LINE_Y);
      ctx.lineTo(GAME_RIGHT - 18, DANGER_LINE_Y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.font = '700 ' + DANGER_LABEL_FONT_SIZE + 'px "DM Sans", "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const label = '危險線';
      const textWidth = ctx.measureText(label).width;
      roundedRect(ctx, GAME_LEFT + 23, DANGER_LINE_Y - 16, textWidth + 20, 31, 15);
      ctx.fillStyle = warningFlash ? 'rgba(255,235,232,.98)' : 'rgba(255,255,255,.94)';
      ctx.fill();
      ctx.fillStyle = warningFlash ? '#ff3b30' : '#aa5b4d';
      ctx.fillText(label, GAME_LEFT + 33, DANGER_LINE_Y);
      ctx.restore();
    }

    function drawEntities() {
      const ordered = [...entities.values()].sort((a, b) => a.body.position.y - b.body.position.y);
      for (const entity of ordered) {
        if (!entities.has(entity.body.id)) continue;
        const x = entity.body.position.x;
        const y = entity.body.position.y;
        let alpha = 1;
        let scale = 1;
        if (entity.state === 'removing') {
          const progress = clamp((gameTime - entity.stateAt) / DDM_FADE_DURATION, 0, 1);
          alpha = 1 - progress;
          scale = 1 - progress * 0.68;
        } else if (entity.state === 'special') {
          const progress = clamp((gameTime - entity.stateAt) / MAX_PRESENTATION_DURATION, 0, 1);
          if (progress < .55) scale = 1 + .42 * easeOutCubic(progress / .55);
          else { const tail = (progress - .55) / .45; scale = 1.42 * (1 - easeOutCubic(tail)); alpha = 1 - easeOutCubic(tail); }
        } else if (entity.state === 'merging') {
          const progress = clamp((gameTime - entity.stateAt) / MERGE_DELAY, 0, 1);
          scale = 1 + .12 * Math.sin(progress * Math.PI);
        } else if (entity.popFrom != null) {
          const progress = clamp((gameTime - entity.popFrom) / 280, 0, 1);
          scale = .78 + .22 * easeOutBack(progress);
          if (progress >= 1) entity.popFrom = null;
        }
        drawMelanin(x, y, entity.level, entity.radius, scale, alpha, entity.state === 'special', gameTime - entity.stateAt);
        if (activeSkill && (entity.state === 'active' || entity.state === 'special')) {
          if (entity.level >= MAX_LEVEL || entity.special) drawUnselectableRing(x, y, entity.radius);
          else drawSelectableRing(x, y, entity.radius, activeSkill);
        }
      }
    }

    function drawSelectableRing(x, y, radius, skill) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius + 7, 0, Math.PI * 2);
      ctx.setLineDash([5, 6]);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = skill === 'ssw' ? 'rgba(147, 119, 217, .86)' : 'rgba(65, 177, 154, .86)';
      ctx.stroke();
      ctx.restore();
    }

    function drawUnselectableRing(x, y, radius) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius + 7, 0, Math.PI * 2);
      ctx.setLineDash([3, 7]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(132, 104, 111, .58)';
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '800 12px "DM Sans", "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(91, 70, 79, .9)';
      ctx.fillText('MAX', x, y - radius - 17);
      ctx.restore();
    }

    function drawDropPreview() {
      if (gamePaused || currentLevel == null) return;
      const radius = MELANIN_LEVELS[currentLevel].diameter / 2;
      const x = clamp(currentDropX, GAME_LEFT + radius + 4, GAME_RIGHT - radius - 4);
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = 'rgba(145, 111, 96, .32)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, DROP_Y + radius + 9);
      ctx.lineTo(x, GAME_FLOOR - 12);
      ctx.stroke();
      ctx.restore();
      drawMelanin(x, DROP_Y + radius, currentLevel, radius, 1, .84, false);
    }

    function drawMelanin(x, y, level, radius, scale = 1, alpha = 1, isSpecial = false, specialAge = 0, renderContext = ctx) {
      const ctx = renderContext;
      const config = MELANIN_LEVELS[level];
      const r = radius * scale;
      ctx.save();
      ctx.globalAlpha = alpha;

      const gradient = ctx.createRadialGradient(x - r * .34, y - r * .42, r * .08, x + r * .05, y + r * .08, r * 1.2);
      gradient.addColorStop(0, config.highlight);
      gradient.addColorStop(.42, config.color);
      gradient.addColorStop(1, config.shadow);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * .055);
      ctx.strokeStyle = isSpecial ? 'rgba(233,255,244,.8)' : (config.outlineColor || 'rgba(255,247,255,.38)');
      ctx.stroke();

      // Tiny glossy highlight.
      ctx.beginPath();
      ctx.ellipse(x - r * .35, y - r * .47, r * .22, r * .105, -.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,248,255,.28)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - r * .52, y - r * .27, Math.max(1, r * .045), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,252,255,.5)';
      ctx.fill();

      drawFace(x, y, r, level, config, ctx);
      drawLevelBadge(x, y, r, level, config, ctx);
      if (isSpecial) drawMaxAura(x, y, r, specialAge, ctx);
      ctx.restore();
    }

    function drawFace(x, y, orbRadius, level, config, renderContext = ctx) {
      const ctx = renderContext;
      const r = orbRadius * config.faceScale;
      const eyeY = y - r * .15;
      const eyeX = r * config.eyeOffset;
      const eyeW = Math.max(3, r * config.eyeScale);
      const eyeH = Math.max(4, r * config.eyeHeightScale);
      const isWinking = config.face === 'wink';

      drawOpenEye(x - eyeX, eyeY, eyeW, eyeH, 0, config, ctx);
      if (isWinking) drawClosedEye(x + eyeX, eyeY, eyeW, eyeH, config.faceColor, ctx);
      else drawOpenEye(x + eyeX, eyeY, eyeW, eyeH, 0, config, ctx);

      if (config.face === 'mischief') {
        drawBrow(x + eyeX, eyeY - eyeH * 1.2, eyeW * .68, -eyeH * .2, eyeH * .08, config.faceColor, ctx);
      } else if (['proud', 'confident'].includes(config.face)) {
        drawBrow(x - eyeX, eyeY - eyeH * 1.2, eyeW * .68, eyeH * .04, -eyeH * .04, config.faceColor, ctx);
        drawBrow(x + eyeX, eyeY - eyeH * 1.2, eyeW * .68, eyeH * .04, eyeH * .04, config.faceColor, ctx);
      }

      ctx.save();
      ctx.fillStyle = config.cheekColor;
      ctx.beginPath();
      ctx.ellipse(x - r * .5, y + r * .12, r * .12, r * .065, 0, 0, Math.PI * 2);
      ctx.ellipse(x + r * .5, y + r * .12, r * .12, r * .065, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      drawFaceMouth(x, y + r * .23, r, config, ctx);
    }

    function drawOpenEye(x, y, width, height, pupilDirection, config, renderContext = ctx) {
      const ctx = renderContext;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
      ctx.fillStyle = config.eyeColor;
      ctx.fill();
      ctx.strokeStyle = config.eyeOutlineColor;
      ctx.lineWidth = Math.max(1, width * .14);
      ctx.stroke();

      const pupilRadius = Math.max(1.05, width * .39);
      const pupilX = x + pupilDirection * width * .1;
      const pupilY = y + height * .04;
      ctx.beginPath();
      ctx.ellipse(pupilX, pupilY, pupilRadius, pupilRadius * 1.12, 0, 0, Math.PI * 2);
      ctx.fillStyle = config.pupilColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pupilX - pupilRadius * .27, pupilY - pupilRadius * .3, Math.max(.55, pupilRadius * .28), 0, Math.PI * 2);
      ctx.fillStyle = '#FFFCFA';
      ctx.fill();
      ctx.restore();
    }

    function drawClosedEye(x, y, width, height, strokeColor, renderContext = ctx) {
      const ctx = renderContext;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - width, y + height * .1);
      ctx.quadraticCurveTo(x, y + height * .62, x + width, y + height * .1);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(1.5, width * .34);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    function drawBrow(x, y, width, startOffset, endOffset, color, renderContext = ctx) {
      const ctx = renderContext;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - width, y + startOffset);
      ctx.quadraticCurveTo(x, y - width * .32, x + width, y + endOffset);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.2, width * .16);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    function drawFaceMouth(x, y, r, config, renderContext = ctx) {
      const ctx = renderContext;
      const width = r * config.mouthScale;
      let curve = r * .1;
      if (config.face === 'happy' || config.face === 'proud') curve = r * .16;
      if (config.face === 'calm' || config.face === 'gentle') curve = r * .08;

      ctx.save();
      ctx.beginPath();
      if (config.face === 'mischief') {
        ctx.moveTo(x - width, y + r * .015);
        ctx.quadraticCurveTo(x + r * .08, y + curve, x + width, y - r * .025);
      } else {
        ctx.moveTo(x - width, y);
        ctx.quadraticCurveTo(x, y + curve, x + width, y);
      }
      ctx.strokeStyle = config.faceColor;
      ctx.lineWidth = Math.max(1.5, r * .055);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    function drawLevelBadge(x, y, r, level, config, renderContext = ctx) {
      const ctx = renderContext;
      if (config.labelFont <= 0) return;
      const text = `LV${level}`;
      const labelScale = Math.min(1, r / (config.diameter / 2));
      const fontSize = Math.max(9, config.labelFont * labelScale);
      ctx.save();
      ctx.font = `800 ${fontSize}px "DM Sans", "Noto Sans TC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const height = Math.min(r * .72, Math.max(9, fontSize * 1.2));
      const width = ctx.measureText(text).width + Math.max(6, fontSize * .72);
      const badgeTop = y + r * .35;
      roundedRect(ctx, x - width / 2, badgeTop, width, height, height / 2);
      ctx.fillStyle = config.badgeFill;
      ctx.fill();
      ctx.fillStyle = config.labelColor;
      ctx.fillText(text, x, badgeTop + height / 2 + .3);
      ctx.restore();
    }

    function drawMaxAura(x, y, r, age, renderContext = ctx) {
      const ctx = renderContext;
      ctx.save();
      const pulse = 1 + Math.sin(age / 90) * .035;
      ctx.beginPath(); ctx.arc(x, y, r * 1.34 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(112, 207, 177, ${.42 + Math.sin(age / 120) * .12})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        const angle = age / 300 + i * Math.PI / 2;
        const sx = x + Math.cos(angle) * r * 1.58;
        const sy = y + Math.sin(angle) * r * 1.58;
        drawSparkle(sx, sy, 4 + (i % 2) * 2, '#fff0b6', ctx);
      }
      ctx.restore();
    }

    function drawParticles() {
      ctx.save();
      for (const particle of particles) {
        const progress = clamp((gameTime - particle.bornAt) / particle.life, 0, 1);
        ctx.globalAlpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1 - progress * .35), 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        if (particle.size > 4 && progress < .55) drawSparkle(particle.x, particle.y, particle.size * .72, particle.color);
      }
      ctx.restore();
    }

    function drawSparkle(x, y, size, color, renderContext = ctx) {
      const ctx = renderContext;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y - size); ctx.quadraticCurveTo(x + size * .22, y - size * .22, x + size, y);
      ctx.quadraticCurveTo(x + size * .22, y + size * .22, x, y + size);
      ctx.quadraticCurveTo(x - size * .22, y + size * .22, x - size, y);
      ctx.quadraticCurveTo(x - size * .22, y - size * .22, x, y - size);
      ctx.fillStyle = color; ctx.fill();
      ctx.restore();
    }

    function roundedRect(context, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + width, y, x + width, y + height, r);
      context.arcTo(x + width, y + height, x, y + height, r);
      context.arcTo(x, y + height, x, y, r);
      context.arcTo(x, y, x + width, y, r);
      context.closePath();
    }

    function easeOutCubic(value) { return 1 - (1 - value) ** 3; }
    function easeOutBack(value) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2; }

    return Object.freeze({ draw, resizeNextPreview });
  }

  global.DDMGameRenderer = Object.freeze({ createRenderer });
})(window);
