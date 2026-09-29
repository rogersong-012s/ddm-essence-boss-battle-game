(() => {
  'use strict';

  // ---------------------------
  // Tunable game configuration
  // ---------------------------
  // Gameplay constants, theme assets, and mutable run state have one owner each.
  const UI_TEXT = window.DDMGameText;
  const text = (key, values) => UI_TEXT.get(key, values);
  const GAME_CONFIG = window.DDMGameConfig;
  const {
    DEBUG, DANGER_ZONE_DIAMETER_MULTIPLIER, SKILL_CONFIG, DROP_DAMAGE,
    DANGER_DURATION_MS, CENTRAL_TOAST_DURATION_MULTIPLIER, WHITE_SCORE_DROP_LEVELS, DROP_COOLDOWN, PHYSICS_GRAVITY, PHYSICS_GRAVITY_SCALE, PHYSICS_TIMESTEP,
    MAX_PHYSICS_STEPS_PER_FRAME, MERGE_DELAY, DDM_FADE_DURATION, MAX_PRESENTATION_DURATION,
    COMBO_WINDOW, MAX_MELANIN_BONUS, BOSS_CONFIG, SCORE_TABLE, MAX_FRAME_DELTA, MAX_CANVAS_SCALE
  } = GAME_CONFIG;
  let runtimeLayout = GAME_CONFIG.createRuntimeLayout(window.DDMMobileUI?.getMode?.() || 'desktop');
  let BALL_THEMES = window.DDMGameThemes.create((level) => GAME_CONFIG.ballDiameterForLevel(level, runtimeLayout.PLAYFIELD_WIDTH)).BALL_THEMES;
  const MAX_LEVEL = BALL_THEMES.warm.levels.length - 1;
  const SECOND_HIGHEST_LEVEL = MAX_LEVEL - 1;
  let currentThemeKey = 'rainbow';
  let MELANIN_LEVELS = BALL_THEMES[currentThemeKey].levels;
  let secondHighestRadius = MELANIN_LEVELS[SECOND_HIGHEST_LEVEL].diameter / 2;
  let secondHighestDiameter = secondHighestRadius * 2;
  let dangerZoneHeight = secondHighestDiameter * DANGER_ZONE_DIAMETER_MULTIPLIER;
  let DANGER_LINE_Y = runtimeLayout.PLAYFIELD_BOTTOM - dangerZoneHeight;
  let lastDangerDebugKey = '';

  const canvas = document.querySelector('#game-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const nextPreviewCanvas = document.querySelector('#next-preview-canvas');
  const nextPreviewCtx = nextPreviewCanvas.getContext('2d', { alpha: true });
  const wrapper = document.querySelector('.game-wrapper');
  const nextEl = document.querySelector('#next-level');
  const nextPreviewEl = document.querySelector('#next-preview');
  const maxRuleDescriptionEl = document.querySelector('#max-rule-description');
  const ddmButton = document.querySelector('#ddm-button');
  const ddmCountEl = document.querySelector('#ddm-count');
  const ddmPanel = document.querySelector('.ddm-panel');
  const ddmHint = document.querySelector('#ddm-hint');
  const sswButton = document.querySelector('#ssw-button');
  const sswCountEl = document.querySelector('#ssw-count');
  const sswPanel = document.querySelector('.ssw-panel');
  const sswHint = document.querySelector('#ssw-hint');
  const modeBanner = document.querySelector('#mode-banner');
  const modeBannerMessage = document.querySelector('#skill-mode-message');
  const toastEl = document.querySelector('#toast');
  const comboEl = document.querySelector('#combo-pop');
  const gameOverEl = document.querySelector('#game-over');
  const gameOverTitleEl = document.querySelector('#game-over-title');
  const gameOverCopyEl = document.querySelector('#game-over-copy');
  const endStateEyebrowEl = document.querySelector('#end-state-eyebrow');
  const endStateBadgeEl = document.querySelector('#end-state-badge');
  const finalHighestEl = document.querySelector('#final-highest');
  const restartButtonEl = document.querySelector('#restart-button');
  const continueButtonEl = document.querySelector('#continue-button');
  const startWhiteModeButtonEl = document.querySelector('#start-white-mode-button');
  const endStatsEl = document.querySelector('.over-stats');
  const bossTargetEl = document.querySelector('#boss-target');
  const bossNameEl = document.querySelector('#boss-name');
  const bossTransitionEl = document.querySelector('#boss-transition');
  const bossTransitionKickerEl = document.querySelector('#boss-transition-kicker');
  const bossTransitionTitleEl = document.querySelector('#boss-transition-title');
  const bossTransitionNextEl = document.querySelector('#boss-transition-next');
  const playerNameEl = document.querySelector('#player-name');
  const bossHealthCardEl = document.querySelector('#boss-health-card');
  const bossHpLabelEl = document.querySelector('#boss-hp-label');
  const bossCharacterFrameEl = document.querySelector('#boss-character-frame');
  const bossCharacterImageEl = document.querySelector('#boss-character-image');
  const bossCharacterFallbackEl = bossCharacterFrameEl.querySelector('.character-fallback');
  const playerHeroEl = document.querySelector('.player-hero');
  const playerCaptionEl = document.querySelector('.player-caption');
  const playerCharacterFrameEl = document.querySelector('#player-character-frame');
  const playerCharacterImageEl = document.querySelector('#player-character-image');
  const playerCharacterFallbackEl = playerCharacterFrameEl.querySelector('.character-fallback');
  const bossHpTrackEl = document.querySelector('#boss-hp-track');
  const bossHpFillEl = document.querySelector('#boss-hp-fill');
  const bossHpValueEl = document.querySelector('#boss-hp-value');
  const nextPanelEl = document.querySelector('.next-panel');
  const attackEffectsEl = document.querySelector('#attack-effects');
  const themeOptionsEl = document.querySelector('#theme-options');
  const themeSwitcherEl = document.querySelector('#theme-switcher');
  const themeSelectors = new Map();
  const characterVisuals = window.DDMGameCharacters.createCharacterVisuals({
    playerImageEl: playerCharacterImageEl,
    playerFallbackEl: playerCharacterFallbackEl,
    bossImageEl: bossCharacterImageEl,
    bossFallbackEl: bossCharacterFallbackEl,
    playerConfig: GAME_CONFIG.PLAYER_CONFIG,
    text: UI_TEXT
  });
  const playerProgression = window.DDMGameProgression.createPlayerProgression(GAME_CONFIG, playerNameEl, UI_TEXT);

  let engine;
  let bowlBodies = [];
  let entities = new Map();
  let timers = new Set();
  let particles = [];
  let currentRunHighestLevel = 0;
  let currentRunMaxMergeCount = 0;
  let ddmUses = SKILL_CONFIG.ddmInitialUses;
  let sswUses = SKILL_CONFIG.sswInitialUses;
  let currentLevel = null;
  let nextLevel;
  let readyToDrop = true;
  let activeSkill = null;
  let ddmBusy = false;
  let gameOver = false;
  let gamePaused = false;
  let bossDefeated = false;
  let continuedAfterVictory = false;
  let activeEndState = null;
  const deferredPausedMerges = [];
  let lastFrame = 0;
  let gameTime = 0;
  let physicsAccumulator = 0;
  let isPointerInsidePlayfield = false;
  let pointerDownStartedInsidePlayfield = false;
  let activePointerId = null;
  let activePointerType = 'mouse';
  let lastValidDropX = runtimeLayout.PLAYFIELD_CENTER_X;
  let currentDropX = runtimeLayout.PLAYFIELD_CENTER_X;
  let dangerSince = null;
  const dangerTimer = window.DDMGameDangerZone.createDangerTimer(DANGER_DURATION_MS);
  let dangerLineWarning = false;
  let lastMergeTime = -Infinity;
  let comboCount = 0;
  let debugSide = 1;
  let toastTimer = null;
  let comboTimer = null;
  let resizeObserver;
  let presentationLandscape = window.DDMMobileUI?.isLandscape?.() || false;

  const combat = window.DDMGameCombat.createCombatSystem({
    config: BOSS_CONFIG,
    bossTargetEl, bossHealthCardEl, bossNameEl, bossHpLabelEl, bossHpTrackEl, bossHpFillEl, bossHpValueEl,
    text: UI_TEXT,
    setBossVisual: characterVisuals.setBoss,
    isPaused: () => gamePaused,
    schedule,
    formatNumber,
    onBossDefeated: handleBossDefeat
  });
  combat.updateUI();
  nextLevel = randomDropLevel();
  const attackEffects = window.DDMGameEffects.createAttackEffects({
    BOSS_CONFIG, attackEffectsEl, bossCharacterFrameEl, playerCharacterFrameEl, text: UI_TEXT,
    getLayoutMetrics, getGameMode: () => combat.mode, getBossHp: () => combat.bossHp,
    isPaused: () => gamePaused, formatNumber, schedule,
    applyCombatValue: (...args) => combat.applyCombatValue(...args), clamp
  });
  const { playPlayerAttackEffect, cancelUnresolvedBossAttacks, clearBossAttackEffects, reflowBossAttackEffects } = attackEffects;
  const renderer = window.DDMGameRenderer.createRenderer({
    canvas, ctx, nextPreviewCanvas, nextPreviewCtx, config: GAME_CONFIG, layout: runtimeLayout, clamp, text: UI_TEXT,
    getState: () => ({
      gameTime, dangerSince, dangerLineWarning, particles, entities, activeSkill, gamePaused,
      currentLevel, currentDropX, nextLevel, MELANIN_LEVELS, DANGER_LINE_Y,
      playerBallScale: playerProgression.getBallScale(), uiScale: getUIScale()
    })
  });

  if (!window.Matter) {
    showToast(text('toast.physicsError'), 8000);
    ddmButton.disabled = true;
    sswButton.disabled = true;
    return;
  }

  const { Engine, Bodies, Body, Sleeping, Composite, Events } = Matter;
  attackEffectsEl.setAttribute('viewBox', `0 0 ${runtimeLayout.LOGICAL_WIDTH} ${runtimeLayout.LOGICAL_HEIGHT}`);
  const ballSizeManager = window.DDMGameBallSizes.createBallSizeManager({
    Body,
    getEntities: () => entities,
    getBaseRadius: (level) => MELANIN_LEVELS[level].diameter / 2,
    getPlayerScale: () => playerProgression.getBallScale()
  });
  // Sleeping bodies can keep stale support after a DDM removal. The pile is small enough to simulate continuously.
  engine = Engine.create({ enableSleeping: false });
  engine.gravity.y = PHYSICS_GRAVITY;
  engine.gravity.scale = PHYSICS_GRAVITY_SCALE;
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  engine.constraintIterations = 2;
  createWalls();

  Events.on(engine, 'collisionStart', handleCollision);
  Events.on(engine, 'collisionActive', handleCollision);

  initializeThemeSelector();
  updateSkillUI();
  updateNextUI();
  resizeGame();
  resizeObserver = new ResizeObserver(resizeGame);
  resizeObserver.observe(wrapper);
  window.addEventListener('resize', resizeGame, { passive: true });
  window.addEventListener('ddm-ui-mode-change', (event) => setRuntimeLayoutMode(event.detail?.mode));
  window.addEventListener('ddm-orientation-change', (event) => {
    presentationLandscape = Boolean(event.detail?.landscape);
    if (presentationLandscape) {
      resetPointerGesture();
      isPointerInsidePlayfield = false;
    }
  });
  canvas.addEventListener('pointerenter', handlePointerMove);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerleave', handlePointerLeave);
  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerCancel);
  window.addEventListener('blur', () => {
    resetPointerGesture();
    isPointerInsidePlayfield = false;
  });
  ddmButton.addEventListener('click', () => toggleSkillMode('ddm'));
  sswButton.addEventListener('click', () => toggleSkillMode('ssw'));
  document.querySelector('#cancel-skill').addEventListener('click', cancelSkillMode);
  restartButtonEl.addEventListener('click', restartGame);
  continueButtonEl.addEventListener('click', showWhiteModeRules);
  startWhiteModeButtonEl.addEventListener('click', startWhiteMode);
  document.querySelector('#restart-top').addEventListener('click', restartGame);
  window.addEventListener('keydown', handleDebugKey);

  requestAnimationFrame(frame);

  function randomDropLevel() {
    if (combat.mode === 'whiteScore') {
      const index = Math.floor(Math.random() * WHITE_SCORE_DROP_LEVELS.length);
      return WHITE_SCORE_DROP_LEVELS[index];
    }

    const poolMaxLevel = getSpawnPoolMaxLevel(currentRunHighestLevel);
    return 1 + Math.floor(Math.random() * poolMaxLevel);
  }

  function getSpawnPoolMaxLevel(highestReachedLevel) {
    if (highestReachedLevel >= 7) return 4;
    if (highestReachedLevel >= 5) return 3;
    return 2;
  }

  function createWalls() {
    const wallHeight = runtimeLayout.PLAYFIELD_HEIGHT + runtimeLayout.WALL_EXTENSION;
    const wallCenterY = (runtimeLayout.GAME_FLOOR + runtimeLayout.GAME_TOP) / 2;
    const options = { isStatic: true, friction: 0.48, restitution: 0.18, label: 'bowl-wall' };
    const leftWall = Bodies.rectangle(runtimeLayout.GAME_LEFT - runtimeLayout.WALL_THICKNESS / 2, wallCenterY, runtimeLayout.WALL_THICKNESS, wallHeight, options);
    const rightWall = Bodies.rectangle(runtimeLayout.GAME_RIGHT + runtimeLayout.WALL_THICKNESS / 2, wallCenterY, runtimeLayout.WALL_THICKNESS, wallHeight, options);
    const floor = Bodies.rectangle((runtimeLayout.GAME_LEFT + runtimeLayout.GAME_RIGHT) / 2, runtimeLayout.GAME_FLOOR + runtimeLayout.WALL_THICKNESS / 2, runtimeLayout.GAME_RIGHT - runtimeLayout.GAME_LEFT + runtimeLayout.WALL_THICKNESS * 2, runtimeLayout.WALL_THICKNESS, options);
    bowlBodies = [leftWall, rightWall, floor];
    Composite.add(engine.world, bowlBodies);
  }

  function createMelanin(level, x, y, options = {}) {
    const config = MELANIN_LEVELS[level];
    const baseRadius = config.diameter / 2;
    const radius = playerProgression.getScaledRadius(baseRadius);
    const body = Bodies.circle(x, y, radius, {
      label: `melanin-lv${level}`,
      restitution: options.special ? 0 : 0.2,
      friction: 0.32,
      frictionStatic: 0.66,
      frictionAir: 0.012,
      density: 0.0011,
      slop: 0.01,
      sleepThreshold: 90,
      isStatic: Boolean(options.special),
      isSensor: Boolean(options.special)
    });
    const entity = {
      body,
      level,
      baseRadius,
      radius,
      state: options.special ? 'special' : 'active',
      bornAt: gameTime,
      dangerBornAt: Number.isFinite(options.dangerBornAt) ? options.dangerBornAt : gameTime,
      stateAt: gameTime,
      special: Boolean(options.special),
      mergedInto: false
    };
    body.plugin = body.plugin || {};
    body.plugin.melanin = entity;
    entities.set(body.id, entity);
    Composite.add(engine.world, body);
    registerReachedLevel(level);
    return entity;
  }

  function registerReachedLevel(level) {
    if (level > currentRunHighestLevel) {
      currentRunHighestLevel = level;
    }
  }

  function initializeThemeSelector() {
    if (!themeOptionsEl) return;
    themeOptionsEl.replaceChildren();
    themeSelectors.clear();
    for (const [themeKey, theme] of Object.entries(BALL_THEMES)) {
      const selector = document.createElement('button');
      selector.type = 'button';
      selector.className = 'theme-dot';
      selector.dataset.themeKey = themeKey;
      const themeName = text(theme.nameKey);
      selector.setAttribute('aria-label', text('theme.select', { theme: themeName }));
      selector.dataset.themeName = themeName;
      const swatch = document.createElement('span');
      swatch.className = 'theme-dot-swatch';
      swatch.style.setProperty('--theme-swatch', theme.swatch);
      swatch.setAttribute('aria-hidden', 'true');
      selector.append(swatch);
      selector.addEventListener('click', () => setTheme(themeKey));
      themeOptionsEl.append(selector);
      themeSelectors.set(themeKey, selector);
    }
    updateThemeSelector();
  }

  function updateThemeSelector() {
    const activeTheme = BALL_THEMES[currentThemeKey];
    themeSwitcherEl?.setAttribute('aria-label', text('theme.current', { theme: text(activeTheme.nameKey) }));
    for (const [themeKey, selector] of themeSelectors) {
      const isActive = themeKey === currentThemeKey;
      selector.setAttribute('aria-pressed', String(isActive));
      selector.classList.toggle('is-active', isActive);
    }
  }

  function setTheme(themeKey) {
    if (!BALL_THEMES[themeKey] || themeKey === currentThemeKey) return;
    currentThemeKey = themeKey;
    MELANIN_LEVELS = BALL_THEMES[currentThemeKey].levels;
    updateDangerLineGeometry(getUIScale());
    updateThemeSelector();
    renderer.draw();
  }

  function spawnNextMelanin() {
    if (gamePaused) return;
    currentLevel = nextLevel;
    const radius = ballSizeManager.getScaledRadius(currentLevel);
    const spawnX = isPointerInsidePlayfield ? lastValidDropX : runtimeLayout.PLAYFIELD_CENTER_X;
    currentDropX = clamp(spawnX, runtimeLayout.GAME_LEFT + radius + 4, runtimeLayout.GAME_RIGHT - radius - 4);
    if (isPointerInsidePlayfield) lastValidDropX = currentDropX;
    registerReachedLevel(currentLevel);
    nextLevel = randomDropLevel();
    updateNextUI();
  }

  function updateNextUI() {
    if (currentLevel == null) spawnNextMelanin();
    nextEl.textContent = text('next.level', { level: nextLevel });
    nextPreviewEl.dataset.level = String(nextLevel);
    nextPreviewEl.setAttribute('aria-label', text('next.preview', { level: nextLevel }));
  }

  function getUIScale(frameWidth = wrapper.clientWidth) {
    return frameWidth / runtimeLayout.LOGICAL_WIDTH;
  }

  function updateDangerLineGeometry(uiScale) {
    // Drawing and Game Over use the same logical Y value; resize only changes its rendered scale.
    secondHighestRadius = MELANIN_LEVELS[SECOND_HIGHEST_LEVEL].diameter / 2;
    secondHighestDiameter = secondHighestRadius * 2;
    dangerZoneHeight = secondHighestDiameter * DANGER_ZONE_DIAMETER_MULTIPLIER;
    DANGER_LINE_Y = runtimeLayout.PLAYFIELD_BOTTOM - dangerZoneHeight;
    const debugKey = String(uiScale) + ':' + secondHighestDiameter;
    if (DEBUG && debugKey !== lastDangerDebugKey) {
      console.debug('[Melanin Merge] danger line geometry', {
        uiScale, playfieldHeight: runtimeLayout.PLAYFIELD_HEIGHT, playfieldBottom: runtimeLayout.PLAYFIELD_BOTTOM, secondHighestRadius,
        secondHighestDiameter, dangerZoneHeight, dangerLineY: DANGER_LINE_Y
      });
      lastDangerDebugKey = debugKey;
    }
  }

  function getLayoutMetrics() {
    const frameRect = wrapper.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / runtimeLayout.LOGICAL_WIDTH;
    const scaleY = canvasRect.height / runtimeLayout.LOGICAL_HEIGHT;
    const playfieldRect = {
      left: canvasRect.left + runtimeLayout.GAME_LEFT * scaleX,
      top: canvasRect.top + (runtimeLayout.GAME_TOP - runtimeLayout.BOWL_TOP_PADDING) * scaleY,
      right: canvasRect.left + runtimeLayout.GAME_RIGHT * scaleX,
      bottom: canvasRect.top + runtimeLayout.PLAYFIELD_BOTTOM * scaleY
    };
    playfieldRect.width = playfieldRect.right - playfieldRect.left;
    playfieldRect.height = playfieldRect.bottom - playfieldRect.top;
    return {
      frameRect,
      frameWidth: frameRect.width,
      frameHeight: frameRect.height,
      canvasRect,
      scaleX,
      scaleY,
      playfieldRect
    };
  }

  function updateCombatLayout(metrics = getLayoutMetrics()) {
    const { frameRect, playfieldRect } = metrics;
    if (!frameRect.width || !frameRect.height || runtimeLayout.mode === 'mobile') {
      if (runtimeLayout.mode === 'mobile') {
        bossTargetEl.style.left = '';
        bossTargetEl.style.top = '';
        playerHeroEl.style.left = '';
        playerHeroEl.style.top = '';
        playerHeroEl.style.bottom = '';
      }
      return;
    }

    const leftZoneCenterX = (frameRect.left + playfieldRect.left) / 2;
    const leftZoneCenterPercent = ((leftZoneCenterX - frameRect.left) / frameRect.width) * 100;
    for (const characterEl of [bossTargetEl, playerHeroEl]) {
      characterEl.style.left = `${leftZoneCenterPercent}%`;
    }

    const nextRect = nextPanelEl.getBoundingClientRect();
    bossTargetEl.style.top = `${((nextRect.top - frameRect.top) / frameRect.height) * 100}%`;

    const sswButtonRect = sswButton.getBoundingClientRect();
    playerHeroEl.style.bottom = 'auto';
    const heroTop = playerHeroEl.getBoundingClientRect().top;
    const captionBottomOffset = playerCaptionEl.getBoundingClientRect().bottom - heroTop;
    const playerTop = sswButtonRect.bottom - frameRect.top - captionBottomOffset;
    playerHeroEl.style.top = `${(playerTop / frameRect.height) * 100}%`;
  }

  function setRuntimeLayoutMode(mode) {
    if (!engine || !['desktop', 'mobile'].includes(mode) || runtimeLayout.mode === mode) return;

    const previousLayout = runtimeLayout;
    const nextLayout = GAME_CONFIG.createRuntimeLayout(mode);
    const scaleX = nextLayout.PLAYFIELD_WIDTH / previousLayout.PLAYFIELD_WIDTH;
    const scaleY = nextLayout.PLAYFIELD_HEIGHT / previousLayout.PLAYFIELD_HEIGHT;
    const previousDropX = currentDropX;
    const previousPointerX = lastValidDropX;
    const themes = window.DDMGameThemes.create((level) => GAME_CONFIG.ballDiameterForLevel(level, nextLayout.PLAYFIELD_WIDTH)).BALL_THEMES;

    runtimeLayout = nextLayout;
    BALL_THEMES = themes;
    MELANIN_LEVELS = BALL_THEMES[currentThemeKey].levels;

    const progressionScale = playerProgression.getBallScale();
    for (const entity of entities.values()) {
      const body = entity.body;
      const position = mapGamePoint(body.position, previousLayout, nextLayout);
      const velocity = { x: body.velocity.x * scaleX, y: body.velocity.y * scaleY };
      const angularVelocity = body.angularVelocity;
      const baseRadius = MELANIN_LEVELS[entity.level].diameter / 2;
      const radius = baseRadius * progressionScale;
      const scaleFactor = radius / entity.radius;

      if (Number.isFinite(scaleFactor) && scaleFactor > 0 && Math.abs(scaleFactor - 1) > 1e-12) {
        Body.scale(body, scaleFactor, scaleFactor);
      }
      position.x = clamp(position.x, runtimeLayout.GAME_LEFT + radius + 1, runtimeLayout.GAME_RIGHT - radius - 1);
      position.y = Math.min(position.y, runtimeLayout.GAME_FLOOR - radius - 1);
      Body.setPosition(body, position);
      if (!body.isStatic) {
        Body.setVelocity(body, velocity);
        Body.setAngularVelocity(body, angularVelocity);
      }
      entity.baseRadius = baseRadius;
      entity.radius = radius;
    }

    for (const particle of particles) {
      const position = mapGamePoint(particle, previousLayout, nextLayout);
      particle.x = position.x;
      particle.y = position.y;
      particle.vx *= scaleX;
      particle.vy *= scaleY;
    }

    currentDropX = nextLayout.GAME_LEFT + (previousDropX - previousLayout.GAME_LEFT) * scaleX;
    lastValidDropX = nextLayout.GAME_LEFT + (previousPointerX - previousLayout.GAME_LEFT) * scaleX;
    currentDropX = clamp(currentDropX, runtimeLayout.GAME_LEFT + 4, runtimeLayout.GAME_RIGHT - 4);
    lastValidDropX = clamp(lastValidDropX, runtimeLayout.GAME_LEFT + 4, runtimeLayout.GAME_RIGHT - 4);

    for (const wall of bowlBodies) Composite.remove(engine.world, wall, true);
    bowlBodies = [];
    createWalls();

    attackEffectsEl.setAttribute('viewBox', `0 0 ${runtimeLayout.LOGICAL_WIDTH} ${runtimeLayout.LOGICAL_HEIGHT}`);
    renderer.updateLayout(runtimeLayout);
    updateDangerLineGeometry(getUIScale());
    updateThemeSelector();
    resetPointerGesture();
    isPointerInsidePlayfield = false;
    resizeGame();
    reflowBossAttackEffects();
    renderer.draw();
  }

  function mapGamePoint(point, fromLayout, toLayout) {
    const scaleX = toLayout.PLAYFIELD_WIDTH / fromLayout.PLAYFIELD_WIDTH;
    const scaleY = toLayout.PLAYFIELD_HEIGHT / fromLayout.PLAYFIELD_HEIGHT;
    return {
      x: toLayout.GAME_LEFT + (point.x - fromLayout.GAME_LEFT) * scaleX,
      y: toLayout.GAME_TOP + (point.y - fromLayout.GAME_TOP) * scaleY
    };
  }

  function isPointInsidePlayfield(clientX, clientY) {
    const { playfieldRect } = getLayoutMetrics();
    return clientX >= playfieldRect.left
      && clientX <= playfieldRect.right
      && clientY >= playfieldRect.top
      && clientY <= playfieldRect.bottom;
  }

  function handlePointerMove(event) {
    if (gamePaused || presentationLandscape || !isPointInsidePlayfield(event.clientX, event.clientY)) {
      isPointerInsidePlayfield = false;
      return;
    }
    updateDropPreviewPosition(toLogicalPoint(event));
  }

  function handlePointerLeave() {
    isPointerInsidePlayfield = false;
  }

  function handlePointerDown(event) {
    if (gamePaused || presentationLandscape || activePointerId != null || event.button !== 0) return;
    activePointerId = event.pointerId;
    activePointerType = event.pointerType || 'mouse';
    pointerDownStartedInsidePlayfield = isPointInsidePlayfield(event.clientX, event.clientY);
    if (!pointerDownStartedInsidePlayfield) {
      isPointerInsidePlayfield = false;
      return;
    }
    event.preventDefault();
    try { canvas.setPointerCapture(event.pointerId); } catch { /* Implicit touch capture still handles this gesture. */ }
    updateDropPreviewPosition(toLogicalPoint(event));
  }

  function handlePointerUp(event) {
    if (activePointerId !== event.pointerId) return;
    const startedInside = pointerDownStartedInsidePlayfield;
    const endedInside = isPointInsidePlayfield(event.clientX, event.clientY);
    const pointerType = activePointerType;
    resetPointerGesture();
    if (!endedInside) isPointerInsidePlayfield = false;
    if (!startedInside || !endedInside || gamePaused || presentationLandscape) return;

    event.preventDefault();
    const point = toLogicalPoint(event);
    updateDropPreviewPosition(point);
    if (activeSkill) {
      const target = findMelaninAt(point.x, point.y);
      if (target) useSelectedSkill(target);
      return;
    }
    dropMelanin(currentDropX, pointerType);
  }

  function handlePointerCancel(event) {
    if (activePointerId != null && event.pointerId !== activePointerId) return;
    resetPointerGesture();
    isPointerInsidePlayfield = false;
  }

  function resetPointerGesture() {
    activePointerId = null;
    activePointerType = 'mouse';
    pointerDownStartedInsidePlayfield = false;
  }

  function updateDropPreviewPosition(point) {
    isPointerInsidePlayfield = true;
    if (currentLevel == null) return;
    const radius = ballSizeManager.getScaledRadius(currentLevel);
    lastValidDropX = clamp(point.x, runtimeLayout.GAME_LEFT + radius + 4, runtimeLayout.GAME_RIGHT - radius - 4);
    currentDropX = lastValidDropX;
  }

  function toLogicalPoint(event) {
    const { canvasRect, scaleX, scaleY } = getLayoutMetrics();
    if (!scaleX || !scaleY) return { x: runtimeLayout.PLAYFIELD_CENTER_X, y: runtimeLayout.GAME_TOP };
    return {
      x: (event.clientX - canvasRect.left) / scaleX,
      y: (event.clientY - canvasRect.top) / scaleY
    };
  }

  function dropMelanin(x, pointerType = 'mouse') {
    if (gamePaused || activeSkill || !readyToDrop || currentLevel == null) return;
    const level = currentLevel;
    const radius = ballSizeManager.getScaledRadius(level);
    createMelanin(level, clamp(x, runtimeLayout.GAME_LEFT + radius + 3, runtimeLayout.GAME_RIGHT - radius - 3), runtimeLayout.DROP_Y + radius, {});
    readyToDrop = false;
    playPlayerAttackEffect(DROP_DAMAGE, 'drop');
    currentLevel = null;
    // Touch has no hover position to carry forward; each newly prepared piece starts centered.
    if (pointerType === 'touch') isPointerInsidePlayfield = false;
    spawnNextMelanin();
    schedule(() => { readyToDrop = true; }, DROP_COOLDOWN);
  }

  function handleCollision(event) {
    if (gamePaused) return;
    for (const pair of event.pairs) {
      const first = entities.get(pair.bodyA.id);
      const second = entities.get(pair.bodyB.id);
      if (!first || !second || first === second) continue;
      if (first.state !== 'active' || second.state !== 'active') continue;
      if (first.level !== second.level || first.level >= MAX_LEVEL) continue;
      first.state = 'merging';
      second.state = 'merging';
      first.stateAt = gameTime;
      second.stateAt = gameTime;
      first.mergedInto = true;
      second.mergedInto = true;
      const x = (first.body.position.x + second.body.position.x) / 2;
      const y = (first.body.position.y + second.body.position.y) / 2;
      const mergeLayout = runtimeLayout;
      const next = first.level + 1;
      schedule(() => mergeMelanin(first, second, next, x, y, mergeLayout), MERGE_DELAY);
    }
  }

  function mergeMelanin(first, second, nextLevelValue, x, y, sourceLayout = runtimeLayout) {
    if (!entities.has(first.body.id) || !entities.has(second.body.id)) return;
    if (sourceLayout !== runtimeLayout) {
      const mappedPoint = mapGamePoint({ x, y }, sourceLayout, runtimeLayout);
      x = mappedPoint.x;
      y = mappedPoint.y;
      sourceLayout = runtimeLayout;
    }
    if (gamePaused) {
      if (combat.isBossTransitioning || activeEndState === 'victory') deferredPausedMerges.push([first, second, nextLevelValue, x, y, sourceLayout]);
      return;
    }
    const dangerBornAt = Math.min(first.dangerBornAt, second.dangerBornAt);
    removeEntity(first, false);
    removeEntity(second, false);
    wakeAllMelaninBodies();
    registerCombo();
    const radius = ballSizeManager.getScaledRadius(nextLevelValue);
    const safeX = clamp(x, runtimeLayout.GAME_LEFT + radius + 2, runtimeLayout.GAME_RIGHT - radius - 2);
    const safeY = clamp(y, runtimeLayout.GAME_TOP + radius + 4, runtimeLayout.GAME_FLOOR - radius - 4);
    const damage = calculateMergeDamage(first.level, nextLevelValue);
    playPlayerAttackEffect(damage, 'merge');
    if (nextLevelValue === MAX_LEVEL) {
      resolveMaxBall(safeX, safeY, 'merge');
      return;
    }
    const result = createMelanin(nextLevelValue, safeX, safeY, { dangerBornAt });
    result.popFrom = gameTime;
    emitParticles(safeX, safeY, '#efc782', 9);
  }

  function resolveMaxBall(x, y, source) {
    const maxBlob = createMelanin(MAX_LEVEL, x, y, { special: true });
    maxBlob.completionCounted = false;
    maxBlob.stateAt = gameTime;
    emitParticles(x, y, '#f6d68e', 25);
    showToast(text(source === 'ssw' ? 'toast.maxSsw' : 'toast.maxMerge'), 1500, true);
    schedule(() => {
      if (!entities.has(maxBlob.body.id) || maxBlob.completionCounted) return;
      if (!removeEntity(maxBlob)) return;
      maxBlob.completionCounted = true;
      if (source === 'merge') {
        const rewardMessage = grantMergeMaxReward();
        if (playerProgression.levelUp()) {
          ballSizeManager.resizeAllBalls();
          wakeAllMelaninBodies();
          renderer.draw();
          showToast(text('toast.playerLevelUp'), 1400, true);
          if (rewardMessage) schedule(() => showToast(rewardMessage, 2100, true), 1400);
        } else if (rewardMessage) {
          showToast(rewardMessage, 2100, true);
        }
      }
      emitParticles(x, y, '#82d8bd', 19);
    }, MAX_PRESENTATION_DURATION);
  }

  function grantMergeMaxReward() {
    currentRunMaxMergeCount += 1;
    const rewardSkill = window.DDMGameSkills.chooseMaxRewardSkill(
      ddmUses, sswUses, SKILL_CONFIG.ddmMaxUses, SKILL_CONFIG.sswMaxUses, combat.mode
    );
    if (!rewardSkill) {
      return text(combat.mode === 'whiteScore' ? 'toast.maxRewardDdmCapped' : 'toast.maxRewardAllCapped');
    }

    addSkillUses(rewardSkill);
    updateSkillUI();
    const rewardLabel = text(rewardSkill === 'ddm' ? 'toast.ddmUpgrade' : 'toast.sswUpgrade');
    const rewardPrefix = text(combat.mode === 'whiteScore' ? 'toast.whiteMaxRewardPrefix' : 'toast.maxRewardPrefix');
    return text('toast.maxReward', { prefix: rewardPrefix, skill: rewardLabel, uses: getSkillUses(rewardSkill) });
  }

  function registerCombo() {
    if (gameTime - lastMergeTime <= COMBO_WINDOW) comboCount += 1;
    else comboCount = 1;
    lastMergeTime = gameTime;
    if (comboCount >= 2) {
      comboEl.textContent = text('combo', { count: comboCount });
      comboEl.hidden = false;
      comboEl.style.animation = 'none';
      void comboEl.offsetWidth;
      comboEl.style.animation = '';
      if (comboTimer) clearTimeout(comboTimer);
      comboTimer = setTimeout(() => { comboEl.hidden = true; }, 1250);
    }
  }

  function removeEntity(entity, wakeRemaining = true) {
    if (!entity || !entities.has(entity.body.id)) return false;
    Composite.remove(engine.world, entity.body, true);
    entities.delete(entity.body.id);
    if (wakeRemaining) wakeAllMelaninBodies();
    return true;
  }

  function wakeAllMelaninBodies() {
    for (const entity of entities.values()) {
      const body = entity?.body;
      if (body && !body.isStatic) Sleeping.set(body, false);
    }
  }

  function findMelaninAt(x, y) {
    const ordered = [...entities.values()].reverse();
    for (const entity of ordered) {
      const { body, radius, state } = entity;
      if (!entities.has(body.id)) continue;
      const dx = x - body.position.x;
      const dy = y - body.position.y;
      if (dx * dx + dy * dy > (radius * 1.12) ** 2) continue;
      if (state !== 'active' && state !== 'special') {
        showToast(text('toast.mergeBusy'));
        return null;
      }
      return entity;
    }
    return null;
  }

  function getSkillUses(skill) {
    return skill === 'ddm' ? ddmUses : sswUses;
  }

  function setSkillUses(skill, uses) {
    if (skill === 'ddm') ddmUses = uses;
    else sswUses = uses;
  }

  function getSkillMaxUses(skill) {
    return skill === 'ddm' ? SKILL_CONFIG.ddmMaxUses : SKILL_CONFIG.sswMaxUses;
  }

  function addSkillUses(skill, amount = 1) {
    const before = getSkillUses(skill);
    setSkillUses(skill, Math.min(getSkillMaxUses(skill), before + amount));
    return getSkillUses(skill) > before;
  }

  function toggleSkillMode(skill) {
    if (gamePaused || ddmBusy) return;
    if (activeSkill === skill) {
      cancelSkillMode();
      return;
    }
    if (getSkillUses(skill) <= 0) {
      showToast(text('skills.ddmUsesEmpty', { skill: text(skill === 'ddm' ? 'toast.ddmName' : 'toast.sswName') }));
      return;
    }
    activeSkill = skill;
    canvas.classList.toggle('ddm-selecting', skill === 'ddm');
    canvas.classList.toggle('ssw-selecting', skill === 'ssw');
    modeBannerMessage.textContent = text(skill === 'ddm' ? 'skills.ddmMode' : 'skills.sswMode');
    modeBanner.hidden = false;
    updateSkillUI();
  }

  function cancelSkillMode() {
    activeSkill = null;
    canvas.classList.remove('ddm-selecting', 'ssw-selecting');
    modeBanner.hidden = true;
    updateSkillUI();
  }

  function useSelectedSkill(target) {
    if (activeSkill === 'ddm') useDDM(target);
    else if (activeSkill === 'ssw') useSSW(target);
  }

  function useDDM(target) {
    if (gamePaused || ddmBusy || activeSkill !== 'ddm' || !entities.has(target.body.id)) return;
    if (target.level >= MAX_LEVEL || target.special) {
      showToast(text('skills.ddmTooHigh'));
      return;
    }
    if (target.state !== 'active' || ddmUses <= 0) return;
    const damage = calculateDirectDdmDamage(target.level);
    target.state = 'removing';
    target.stateAt = gameTime;
    target.body.isSensor = true;
    ddmBusy = true;
    ddmUses -= 1;
    const x = target.body.position.x;
    const y = target.body.position.y;
    cancelSkillMode();
    updateSkillUI();
    wakeAllMelaninBodies();
    emitParticles(x, y, '#83d7bf', 12);
    playPlayerAttackEffect(damage, 'ddm');
    const impactCopy = text(combat.mode === 'whiteScore' ? 'skills.ddmWhiteResult' : 'skills.ddmHpResult', { damage: formatNumber(damage) });
    showToast(text('skills.ddmResult', { result: impactCopy }), 1600, true);
    schedule(() => {
      if (entities.has(target.body.id)) removeEntity(target);
      ddmBusy = false;
      updateSkillUI();
    }, DDM_FADE_DURATION);
  }

  function useSSW(target) {
    if (gamePaused || activeSkill !== 'ssw' || !entities.has(target.body.id)) return;
    if (target.level >= MAX_LEVEL || target.special) {
      showToast(text('skills.sswTooHigh'));
      return;
    }
    if (target.state !== 'active' || sswUses <= 0) return;
    const nextLevelValue = target.level + 1;
    const { x, y } = target.body.position;
    const velocity = { x: target.body.velocity.x, y: target.body.velocity.y };
    const angle = target.body.angle;
    const angularVelocity = target.body.angularVelocity;
    if (!removeEntity(target, false)) return;
    sswUses -= 1;
    cancelSkillMode();
    updateSkillUI();
    wakeAllMelaninBodies();
    emitParticles(x, y, '#b0a0f1', 18);
    if (nextLevelValue === MAX_LEVEL) {
      resolveMaxBall(x, y, 'ssw');
      return;
    }
    const upgraded = createMelanin(nextLevelValue, x, y, { dangerBornAt: target.dangerBornAt });
    Body.setAngle(upgraded.body, angle);
    Body.setVelocity(upgraded.body, velocity);
    Body.setAngularVelocity(upgraded.body, angularVelocity);
    upgraded.popFrom = gameTime;
    upgraded.lastUpgradeSource = 'ssw';
    showToast(text('skills.sswCompleted', { from: target.level, to: nextLevelValue }), 1600, true);
  }

  function updateSkillUI() {
    const ddmSelected = activeSkill === 'ddm';
    const sswSelected = activeSkill === 'ssw';
    ddmCountEl.textContent = text('count', { uses: ddmUses, max: SKILL_CONFIG.ddmMaxUses });
    sswCountEl.textContent = text('count', { uses: sswUses, max: SKILL_CONFIG.sswMaxUses });
    ddmButton.setAttribute('aria-label', text('skills.ddmUsesAria', { uses: ddmUses, max: SKILL_CONFIG.ddmMaxUses }));
    sswButton.setAttribute('aria-label', text('skills.sswUsesAria', { uses: sswUses, max: SKILL_CONFIG.sswMaxUses }));
    ddmButton.disabled = ddmUses <= 0 || ddmBusy || gamePaused;
    sswButton.disabled = sswUses <= 0 || ddmBusy || gamePaused;
    ddmButton.classList.toggle('is-active', ddmSelected);
    sswButton.classList.toggle('is-active', sswSelected);
    ddmButton.setAttribute('aria-pressed', String(ddmSelected));
    sswButton.setAttribute('aria-pressed', String(sswSelected));
    ddmPanel.classList.toggle('is-active', ddmSelected);
    sswPanel.classList.toggle('is-active', sswSelected);
    ddmHint.textContent = ddmSelected
      ? text('skills.ddmSelectedHint')
      : ddmUses <= 0 ? text('skills.ddmEmptyHint') : text('skills.emptySelection');
    sswHint.textContent = sswSelected
      ? text('skills.sswSelectedHint')
      : sswUses <= 0
        ? combat.mode === 'whiteScore' ? text('skills.sswWhiteEmptyHint') : text('skills.ddmEmptyHint')
        : text('skills.emptySswSelection');
    maxRuleDescriptionEl.textContent = combat.mode === 'whiteScore'
      ? text('rules.maxWhiteDescription')
      : text('rules.maxDescription');
  }

  function calculateMergeScore(level) {
    return SCORE_TABLE[level] || 0;
  }

  function calculateMergeDamage(level, resultingLevel) {
    const mergeScore = calculateMergeScore(level);
    const maxLevelCompletionBonus = resultingLevel === MAX_LEVEL ? MAX_MELANIN_BONUS : 0;
    return mergeScore + maxLevelCompletionBonus;
  }

  function calculateDirectDdmDamage(level) {
    const standardDamage = calculateMergeScore(level);
    return Math.max(0, standardDamage * SKILL_CONFIG.directDdmDamageMultiplier);
  }

  function formatNumber(value) {
    return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  function showToast(message, duration = 1450, success = false) {
    toastEl.textContent = message;
    toastEl.classList.toggle('toast-success', success);
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    const visibleDuration = Math.round(duration * CENTRAL_TOAST_DURATION_MULTIPLIER);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, visibleDuration);
  }

  function schedule(callback, delay) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  }

  function emitParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 130;
      const life = 420 + Math.random() * 420;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 25, bornAt: gameTime, life, color, size: 2 + Math.random() * 4 });
    }
  }

  function checkGameOver() {
    const occupied = window.DDMGameDangerZone.hasDangerOccupant(entities.values(), gameTime, DANGER_LINE_Y, MAX_LEVEL);
    const status = dangerTimer.update(occupied, gameTime);
    dangerSince = status.startedAt;
    dangerLineWarning = status.occupied;
    if (status.expired) triggerGameOver();
  }

  function resetDangerState() {
    dangerTimer.reset();
    dangerSince = null;
    dangerLineWarning = false;
  }

  function showEndStateModal(type) {
    const content = {
      defeat: {
        badge: text('end.defeatBadge'), eyebrow: text('end.defeatEyebrow'), title: text('end.defeatTitle'),
        copy: text('end.defeatCopy'), canContinue: false
      },
      victory: {
        badge: text('end.victoryBadge'), eyebrow: text('end.victoryEyebrow'), title: text('end.victoryTitle'),
        copy: text('end.victoryCopy'), canContinue: true
      },
      continued: {
        badge: text('end.continuedBadge'), eyebrow: text('end.continuedEyebrow'), title: text('end.continuedTitle'),
        copy: text('end.continuedCopy', { score: formatNumber(combat.whiteScore) }), canContinue: false
      }
    }[type];
    if (!content) return;

    activeEndState = type;
    startWhiteModeButtonEl.hidden = true;
    restartButtonEl.hidden = false;
    endStatsEl.hidden = false;
    endStateBadgeEl.textContent = content.badge;
    endStateEyebrowEl.textContent = content.eyebrow;
    gameOverTitleEl.textContent = content.title;
    gameOverCopyEl.textContent = content.copy;
    finalHighestEl.textContent = text('level', { level: currentRunHighestLevel });
    continueButtonEl.hidden = !content.canContinue;
    gameOverEl.hidden = false;
    (content.canContinue ? continueButtonEl : restartButtonEl).focus({ preventScroll: true });
  }

  function handleBossDefeat({ defeatedBoss, nextBoss, isFinalBoss, impactEffect }) {
    if (combat.mode !== 'boss' || gamePaused || bossDefeated) return;
    if (isFinalBoss) bossDefeated = true;
    gamePaused = true;
    resetDangerState();
    resetPointerGesture();
    isPointerInsidePlayfield = false;
    activeSkill = null;
    ddmBusy = false;
    modeBanner.hidden = true;
    canvas.classList.remove('ddm-selecting', 'ssw-selecting');
    cancelUnresolvedBossAttacks(impactEffect);
    updateSkillUI();
    showBossTransition(defeatedBoss, nextBoss, isFinalBoss);

    schedule(() => {
      if (isFinalBoss) {
        hideBossTransition();
        showEndStateModal('victory');
        updateSkillUI();
        return;
      }

      combat.advanceBoss();
      hideBossTransition();
      resumeAfterBossTransition();
    }, BOSS_CONFIG.transitionDuration);
  }

  function showBossTransition(defeatedBoss, nextBoss, isFinalBoss) {
    bossTransitionKickerEl.textContent = text(isFinalBoss ? 'boss.transitionFinalKicker' : 'boss.transitionRegularKicker');
    bossTransitionTitleEl.textContent = text('boss.transitionDefeated', { name: defeatedBoss.displayName });
    bossTransitionNextEl.textContent = isFinalBoss
      ? text('boss.transitionFinalNext')
      : text('boss.transitionNext', { name: nextBoss.displayName });
    bossTransitionEl.hidden = false;
    bossTransitionEl.classList.remove('is-active');
    void bossTransitionEl.offsetWidth;
    bossTransitionEl.classList.add('is-active');
  }

  function hideBossTransition() {
    bossTransitionEl.classList.remove('is-active');
    bossTransitionEl.hidden = true;
  }

  function resumeAfterBossTransition() {
    gamePaused = false;
    physicsAccumulator = 0;
    lastFrame = performance.now();
    if (currentLevel == null) spawnNextMelanin();
    updateSkillUI();
    const pendingMerges = deferredPausedMerges.splice(0);
    for (const merge of pendingMerges) mergeMelanin(...merge);
  }

  function triggerGameOver() {
    if (gameOver || gamePaused) return;
    gameOver = true;
    gamePaused = true;
    resetDangerState();
    resetPointerGesture();
    isPointerInsidePlayfield = false;
    // Timed clean-up still runs (for example, an already-earned MAX merge reward).
    // Pending gameplay callbacks check gamePaused; restartGame clears all timers.
    activeSkill = null;
    ddmBusy = false;
    modeBanner.hidden = true;
    canvas.classList.remove('ddm-selecting', 'ssw-selecting');
    cancelUnresolvedBossAttacks();
    showEndStateModal(continuedAfterVictory ? 'continued' : 'defeat');
    updateSkillUI();
  }

  function showWhiteModeRules() {
    if (activeEndState !== 'victory' || !bossDefeated || gameOverEl.hidden) return;
    activeEndState = 'whiteModeIntro';
    endStateBadgeEl.textContent = text('end.victoryBadge');
    endStateEyebrowEl.textContent = text('end.whiteRulesEyebrow');
    gameOverTitleEl.textContent = text('end.whiteRulesTitle');
    gameOverCopyEl.textContent = text('end.whiteRulesCopy');
    endStatsEl.hidden = true;
    continueButtonEl.hidden = true;
    restartButtonEl.hidden = true;
    startWhiteModeButtonEl.hidden = false;
    startWhiteModeButtonEl.focus({ preventScroll: true });
  }

  function startWhiteMode() {
    if (activeEndState !== 'whiteModeIntro' || !bossDefeated || !combat.continueAfterVictory()) return;
    activeEndState = null;
    continuedAfterVictory = true;
    gameOver = false;
    gamePaused = false;
    hideBossTransition();
    gameOverEl.hidden = true;
    physicsAccumulator = 0;
    lastFrame = performance.now();
    currentLevel = randomDropLevel();
    nextLevel = randomDropLevel();
    updateNextUI();
    renderer.draw();
    readyToDrop = true;
    startWhiteModeButtonEl.hidden = true;
    restartButtonEl.hidden = false;
    continueButtonEl.hidden = true;
    endStatsEl.hidden = false;
    const pendingMerges = deferredPausedMerges.splice(0);
    updateSkillUI();
    for (const merge of pendingMerges) mergeMelanin(...merge);
  }

  function restartGame() {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    if (toastTimer) clearTimeout(toastTimer);
    if (comboTimer) clearTimeout(comboTimer);
    Composite.clear(engine.world, false, true);
    Engine.clear(engine);
    entities.clear();
    particles = [];
    deferredPausedMerges.length = 0;
    clearBossAttackEffects();
    combat.reset();
    bossDefeated = false;
    continuedAfterVictory = false;
    activeEndState = null;
    bossTargetEl.classList.remove('is-hit');
    hideBossTransition();
    combat.updateUI();
    currentRunHighestLevel = 0;
    currentRunMaxMergeCount = 0;
    playerProgression.reset();
    ddmUses = SKILL_CONFIG.ddmInitialUses;
    sswUses = SKILL_CONFIG.sswInitialUses;
    currentLevel = null;
    nextLevel = randomDropLevel();
    isPointerInsidePlayfield = false;
    resetPointerGesture();
    lastValidDropX = runtimeLayout.PLAYFIELD_CENTER_X;
    currentDropX = runtimeLayout.PLAYFIELD_CENTER_X;
    readyToDrop = true;
    activeSkill = null;
    ddmBusy = false;
    gameOver = false;
    gamePaused = false;
    resetDangerState();
    lastMergeTime = -Infinity;
    comboCount = 0;
    gameTime = 0;
    physicsAccumulator = 0;
    comboEl.hidden = true;
    toastEl.hidden = true;
    modeBanner.hidden = true;
    gameOverEl.hidden = true;
    continueButtonEl.hidden = true;
    startWhiteModeButtonEl.hidden = true;
    restartButtonEl.hidden = false;
    endStatsEl.hidden = false;
    canvas.classList.remove('ddm-selecting', 'ssw-selecting');
    createWalls();
    updateSkillUI();
    updateNextUI();
  }

  function handleDebugKey(event) {
    if (!DEBUG || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const targetName = event.target?.tagName;
    if (targetName === 'INPUT' || targetName === 'TEXTAREA' || event.target?.isContentEditable) return;
    if (event.key.toLowerCase() === 'r') { restartGame(); return; }
    if (gamePaused || presentationLandscape) return;
    if (event.key.toLowerCase() === 'g') { triggerGameOver(); return; }
    if (event.key.toLowerCase() === 'd') {
      const gainedDdm = addSkillUses('ddm');
      const gainedSsw = addSkillUses('ssw');
      updateSkillUI();
      showToast(gainedDdm || gainedSsw
        ? text('toast.debugSkillUses', { ddm: ddmUses, ssw: sswUses })
        : text('toast.skillMaxReached'), 1250, gainedDdm || gainedSsw);
      return;
    }
    const level = Number(event.key);
    if (level >= 1 && level < MAX_LEVEL) debugSpawn(level);
  }

  function debugSpawn(level) {
    if (gamePaused || presentationLandscape) return;
    const radius = ballSizeManager.getScaledRadius(level);
    let spawnX = currentDropX;
    if (!isPointerInsidePlayfield) {
      spawnX = runtimeLayout.LOGICAL_WIDTH / 2 + debugSide * Math.min(radius * 0.62, runtimeLayout.PLAYFIELD_WIDTH * .11);
      debugSide *= -1;
    }
    const entity = createMelanin(level, clamp(spawnX, runtimeLayout.GAME_LEFT + radius + 4, runtimeLayout.GAME_RIGHT - radius - 4), Math.round(runtimeLayout.LOGICAL_HEIGHT * runtimeLayout.LAYOUT.debugSpawnY));
    entity.dangerBornAt = gameTime - 1500;
    showToast(text('toast.spawnedLevel', { level }), 900);
  }

  function resizeGame() {
    if (!canvas || !ctx) return;
    const metrics = getLayoutMetrics();
    if (!metrics.frameWidth || !metrics.frameHeight) return;
    const uiScale = getUIScale(metrics.frameWidth);
    wrapper.style.setProperty('--ui-scale', String(uiScale));
    updateDangerLineGeometry(uiScale);
    const deviceRatio = window.devicePixelRatio || 1;
    const renderScale = Math.max(1, Math.min(MAX_CANVAS_SCALE, deviceRatio * uiScale));
    canvas.width = Math.round(runtimeLayout.LOGICAL_WIDTH * renderScale);
    canvas.height = Math.round(runtimeLayout.LOGICAL_HEIGHT * renderScale);
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    renderer.resizeNextPreview();
    updateCombatLayout(getLayoutMetrics());
    // Resizing within a mode changes presentation scale only. Crossing modes updates the
    // existing bodies and bowl walls in setRuntimeLayoutMode() without restarting the run.
  }

  function frame(now) {
    const delta = lastFrame ? Math.min(MAX_FRAME_DELTA, Math.max(0, now - lastFrame)) : PHYSICS_TIMESTEP;
    lastFrame = now;
    if (!gamePaused && !presentationLandscape) {
      gameTime += delta;
      physicsAccumulator += delta;
      let physicsSteps = 0;
      while (physicsAccumulator >= PHYSICS_TIMESTEP && physicsSteps < MAX_PHYSICS_STEPS_PER_FRAME) {
        Engine.update(engine, PHYSICS_TIMESTEP);
        physicsAccumulator -= PHYSICS_TIMESTEP;
        physicsSteps += 1;
      }
      if (physicsSteps === MAX_PHYSICS_STEPS_PER_FRAME && physicsAccumulator >= PHYSICS_TIMESTEP) physicsAccumulator = 0;
      updateParticles(delta);
      checkGameOver();
    }
    renderer.draw();
    requestAnimationFrame(frame);
  }

  function updateParticles(delta) {
    const seconds = delta / 1000;
    particles = particles.filter((particle) => gameTime - particle.bornAt < particle.life);
    for (const particle of particles) {
      particle.x += particle.vx * seconds;
      particle.y += particle.vy * seconds;
      particle.vy += 110 * seconds;
      particle.vx *= 0.985;
    }
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
})();
