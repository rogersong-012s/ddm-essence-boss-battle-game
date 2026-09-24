(() => {
  'use strict';

  // ---------------------------
  // Tunable game configuration
  // ---------------------------
  const DEBUG = true;
  const REFERENCE_WIDTH = 1600;
  const REFERENCE_HEIGHT = 900;
  const DANGER_ZONE_DIAMETER_MULTIPLIER = 2.05;
  // All gameplay geometry uses one normalized 1600 × 900 reference frame.
  // The wrapper is always displayed at 16:9, so CSS scales this reference space uniformly.
  const LAYOUT = Object.freeze({
    referenceFrame: Object.freeze({ width: REFERENCE_WIDTH, height: REFERENCE_HEIGHT }),
    playfield: Object.freeze({ x: 570 / REFERENCE_WIDTH, y: 156 / REFERENCE_HEIGHT, width: 460 / REFERENCE_WIDTH, height: 630 / REFERENCE_HEIGHT }),
    dropOffset: 42 / 630,
    bowlPadding: Object.freeze({ side: 27 / 460, top: 21 / 630, bottom: 24 / 630 }),
    walls: Object.freeze({ thickness: 26 / 460, extension: 130 / 630 }),
    ballDiameterRatios: Object.freeze([0, 36 / 460, 52 / 460, 72 / 460, 96 / 460, 124 / 460, 158 / 460, 198 / 460, 244 / 460, 298 / 460]),
    debugSpawnY: 610 / REFERENCE_HEIGHT
  });
  const LOGICAL_WIDTH = LAYOUT.referenceFrame.width;
  const LOGICAL_HEIGHT = LAYOUT.referenceFrame.height;
  const PLAYFIELD_WIDTH = Math.round(LOGICAL_WIDTH * LAYOUT.playfield.width);
  const PLAYFIELD_HEIGHT = Math.round(LOGICAL_HEIGHT * LAYOUT.playfield.height);

  function ballDiameterForLevel(level) {
    return Math.round(PLAYFIELD_WIDTH * LAYOUT.ballDiameterRatios[level]);
  }
  const MAX_LEVEL = 9;
  const DANGER_REFERENCE_LEVEL = 8;
  const MAX_DDM = 3;
  const INITIAL_DDM = 3;
  const GAME_OVER_DELAY = 2000;
  const DROP_COOLDOWN = 520;
  const PHYSICS_GRAVITY = 1;
  const PHYSICS_GRAVITY_SCALE = 0.00105;
  const PHYSICS_TIMESTEP = 1000 / 60;
  const MAX_PHYSICS_STEPS_PER_FRAME = 3;
  const MERGE_DELAY = 80;
  const DDM_FADE_DURATION = 420;
  const MAX_PRESENTATION_DURATION = 900;
  const COMBO_WINDOW = 1200;
  const MAX_MELANIN_BONUS = 1800;
  const SCORE_TABLE = { 1: 5, 2: 10, 3: 20, 4: 40, 5: 80, 6: 160, 7: 320, 8: 640 };
  const WARM_LEVELS = [
    null,
    { diameter: ballDiameterForLevel(1), color: '#FCEEE8', highlight: '#FFF9F5', shadow: '#EBDAD7', eyeColor: '#FFFCF9', eyeOutlineColor: '#DFA6A2', pupilColor: '#764B53', cheekColor: 'rgba(220,132,141,.34)', labelColor: '#875B61', badgeFill: 'rgba(255,250,247,.72)', faceColor: '#875B61', face: 'calm', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .2, labelFont: 9 },
    { diameter: ballDiameterForLevel(2), color: '#F9E1D7', highlight: '#FFF5EF', shadow: '#EBCBC1', eyeColor: '#FFFCF8', eyeOutlineColor: '#D99A97', pupilColor: '#74474F', cheekColor: 'rgba(220,125,138,.34)', labelColor: '#8C565B', badgeFill: 'rgba(255,249,245,.68)', faceColor: '#8C565B', face: 'smile', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .22, labelFont: 12 },
    { diameter: ballDiameterForLevel(3), color: '#F6D1C2', highlight: '#FFEFE8', shadow: '#E7B6AA', eyeColor: '#FFFBF7', eyeOutlineColor: '#D48686', pupilColor: '#75434B', cheekColor: 'rgba(217,113,132,.34)', labelColor: '#945157', badgeFill: 'rgba(255,249,245,.62)', faceColor: '#945157', face: 'happy', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .24, labelFont: 13 },
    { diameter: ballDiameterForLevel(4), color: '#F2C0AF', highlight: '#FFE8E0', shadow: '#E0A698', eyeColor: '#FFF9F5', eyeOutlineColor: '#CB7E82', pupilColor: '#743F49', cheekColor: 'rgba(215,105,127,.33)', labelColor: '#94484F', badgeFill: 'rgba(255,248,244,.58)', faceColor: '#94484F', face: 'wink', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .22, labelFont: 14 },
    { diameter: ballDiameterForLevel(5), color: '#EEAE9B', highlight: '#FFE0D6', shadow: '#D78E84', eyeColor: '#FFF9F4', eyeOutlineColor: '#C87077', pupilColor: '#733B46', cheekColor: 'rgba(211,99,123,.32)', labelColor: '#8A454D', badgeFill: 'rgba(255,248,243,.56)', faceColor: '#8A454D', face: 'proud', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .25, labelFont: 16 },
    { diameter: ballDiameterForLevel(6), color: '#E99988', highlight: '#FFD7CE', shadow: '#D27A75', eyeColor: '#FFF9F5', eyeOutlineColor: '#C96C72', pupilColor: '#703A45', cheekColor: 'rgba(219,112,132,.32)', labelColor: '#80434B', badgeFill: 'rgba(255,247,243,.5)', faceColor: '#80434B', face: 'mischief', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .23, labelFont: 18 },
    { diameter: ballDiameterForLevel(7), color: '#E28379', highlight: '#FFC9C3', shadow: '#C96769', eyeColor: '#FFF8F4', eyeOutlineColor: '#F0B0AB', pupilColor: '#713940', cheekColor: 'rgba(255,175,179,.34)', labelColor: '#FFF8F4', badgeFill: 'rgba(132,48,55,.44)', faceColor: '#FFF5F0', face: 'confident', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .22, labelFont: 20 },
    { diameter: ballDiameterForLevel(8), color: '#D96E69', highlight: '#F7B4AF', shadow: '#BE595F', eyeColor: '#FFF8F3', eyeOutlineColor: '#EBA7A4', pupilColor: '#6F3741', cheekColor: 'rgba(255,185,187,.32)', labelColor: '#FFF8F4', badgeFill: 'rgba(111,41,51,.4)', faceColor: '#FFF3EE', face: 'gentle', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .2, labelFont: 22 },
    { diameter: ballDiameterForLevel(9), color: '#CC5C5D', highlight: '#EF9997', shadow: '#AF4C58', eyeColor: '#FFF8F4', eyeOutlineColor: '#E59A9B', pupilColor: '#68323D', cheekColor: 'rgba(255,190,190,.3)', labelColor: '#FFF8F4', badgeFill: 'rgba(95,32,45,.4)', faceColor: '#FFF3EF', face: 'boss', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .23, labelFont: 24 }
  ];

  const RAINBOW_COLORS = [
    null,
    { color: '#EF89AB', highlight: '#FFD3E1', shadow: '#D36B8D', outlineColor: 'rgba(255,248,251,.68)', eyeColor: '#FFFCF9', eyeOutlineColor: '#C76387', pupilColor: '#653B4D', cheekColor: 'rgba(207,74,109,.26)', labelColor: '#704252', badgeFill: 'rgba(255,251,252,.76)', faceColor: '#704252' },
    { color: '#F18477', highlight: '#FFD1C0', shadow: '#D5635D', outlineColor: 'rgba(255,249,247,.68)', eyeColor: '#FFFCF8', eyeOutlineColor: '#CE6B65', pupilColor: '#663E49', cheekColor: 'rgba(213,87,93,.26)', labelColor: '#78454B', badgeFill: 'rgba(255,250,246,.74)', faceColor: '#78454B' },
    { color: '#F3A15F', highlight: '#FFE0B1', shadow: '#D77F44', outlineColor: 'rgba(255,249,244,.68)', eyeColor: '#FFFCF7', eyeOutlineColor: '#CF793F', pupilColor: '#69414A', cheekColor: 'rgba(209,104,94,.25)', labelColor: '#70464D', badgeFill: 'rgba(255,250,245,.76)', faceColor: '#70464D' },
    { color: '#E7C45D', highlight: '#FFF0AE', shadow: '#C8A543', outlineColor: 'rgba(255,252,241,.72)', eyeColor: '#FFFCF5', eyeOutlineColor: '#C7A441', pupilColor: '#49444D', cheekColor: 'rgba(224,102,119,.26)', labelColor: '#514750', badgeFill: 'rgba(255,252,242,.78)', faceColor: '#514750' },
    { color: '#94C56E', highlight: '#DDF0B4', shadow: '#6E9D56', outlineColor: 'rgba(250,255,241,.7)', eyeColor: '#FFFCF5', eyeOutlineColor: '#78A752', pupilColor: '#36523D', cheekColor: 'rgba(226,113,129,.28)', labelColor: '#405842', badgeFill: 'rgba(250,255,244,.76)', faceColor: '#405842' },
    { color: '#67BBC5', highlight: '#C7EBEE', shadow: '#438E9C', outlineColor: 'rgba(244,255,255,.72)', eyeColor: '#FFFCF8', eyeOutlineColor: '#4B9DA9', pupilColor: '#31535D', cheekColor: 'rgba(236,130,148,.27)', labelColor: '#345766', badgeFill: 'rgba(246,255,255,.76)', faceColor: '#345766' },
    { color: '#7298D9', highlight: '#CBDBF6', shadow: '#506DA9', outlineColor: 'rgba(246,250,255,.72)', eyeColor: '#FFF9F3', eyeOutlineColor: '#AFC4EA', pupilColor: '#4B5682', cheekColor: 'rgba(255,178,190,.34)', labelColor: '#FFF9F3', badgeFill: 'rgba(46,67,120,.4)', faceColor: '#FFF7F1' },
    { color: '#8D82D1', highlight: '#D5CEF4', shadow: '#625BA8', outlineColor: 'rgba(250,248,255,.72)', eyeColor: '#FFF9F4', eyeOutlineColor: '#BDB4EA', pupilColor: '#4D477E', cheekColor: 'rgba(255,183,198,.32)', labelColor: '#FFF9F4', badgeFill: 'rgba(53,49,108,.4)', faceColor: '#FFF7F2' },
    { color: '#B174C2', highlight: '#E6C3F0', shadow: '#805397', outlineColor: 'rgba(255,249,255,.72)', eyeColor: '#FFFAF7', eyeOutlineColor: '#D0ADE0', pupilColor: '#543664', cheekColor: 'rgba(255,192,206,.3)', labelColor: '#FFF9F5', badgeFill: 'rgba(72,44,94,.42)', faceColor: '#FFF7F3' }
  ];

  const RAINBOW_LEVELS = [
    null,
    ...WARM_LEVELS.slice(1).map((level, index) => ({ ...level, ...RAINBOW_COLORS[index + 1] }))
  ];

  const BALL_THEMES = {
    warm: { name: '暖色系', swatch: 'linear-gradient(135deg, #FCEEE8 0%, #EEAE9B 55%, #CC5C5D 100%)', levels: WARM_LEVELS },
    rainbow: { name: '繽紛彩色', swatch: 'conic-gradient(#EF89AB 0deg, #F18477 50deg, #F3A15F 95deg, #E7C45D 140deg, #94C56E 185deg, #67BBC5 230deg, #7298D9 275deg, #8D82D1 320deg, #B174C2 360deg)', levels: RAINBOW_LEVELS }
  };

  let currentThemeKey = 'warm';
  let MELANIN_LEVELS = BALL_THEMES[currentThemeKey].levels;

  const GAME_LEFT = Math.round(LOGICAL_WIDTH * LAYOUT.playfield.x);
  const GAME_RIGHT = GAME_LEFT + PLAYFIELD_WIDTH;
  const PLAYFIELD_CENTER_X = (GAME_LEFT + GAME_RIGHT) / 2;
  const GAME_TOP = Math.round(LOGICAL_HEIGHT * LAYOUT.playfield.y);
  const GAME_FLOOR = GAME_TOP + PLAYFIELD_HEIGHT;
  const DROP_Y = GAME_TOP + Math.round(PLAYFIELD_HEIGHT * LAYOUT.dropOffset);
  const WALL_THICKNESS = Math.round(PLAYFIELD_WIDTH * LAYOUT.walls.thickness);
  const WALL_EXTENSION = Math.round(PLAYFIELD_HEIGHT * LAYOUT.walls.extension);
  const BOWL_SIDE_PADDING = Math.round(PLAYFIELD_WIDTH * LAYOUT.bowlPadding.side);
  const BOWL_TOP_PADDING = Math.round(PLAYFIELD_HEIGHT * LAYOUT.bowlPadding.top);
  const BOWL_BOTTOM_PADDING = Math.round(PLAYFIELD_HEIGHT * LAYOUT.bowlPadding.bottom);
  const PLAYFIELD_BOTTOM = GAME_FLOOR + BOWL_BOTTOM_PADDING;
  let lv8Radius = MELANIN_LEVELS[DANGER_REFERENCE_LEVEL].diameter / 2;
  let lv8Diameter = lv8Radius * 2;
  let dangerZoneHeight = lv8Diameter * DANGER_ZONE_DIAMETER_MULTIPLIER;
  let DANGER_LINE_Y = PLAYFIELD_BOTTOM - dangerZoneHeight;
  let lastDangerDebugKey = '';
  const MAX_FRAME_DELTA = 34;
  const MAX_CANVAS_SCALE = 2.5;
  const DANGER_LABEL_FONT_SIZE = LOGICAL_WIDTH * (14 / REFERENCE_WIDTH);
  const BEST_KEY = 'melanin-merge-best-v1';

  const canvas = document.querySelector('#game-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const nextPreviewCanvas = document.querySelector('#next-preview-canvas');
  const nextPreviewCtx = nextPreviewCanvas.getContext('2d', { alpha: true });
  const wrapper = document.querySelector('.game-wrapper');
  const scoreEl = document.querySelector('#score-value');
  const bestEl = document.querySelector('#best-value');
  const highestEl = document.querySelector('#highest-value');
  const nextEl = document.querySelector('#next-level');
  const nextPreviewEl = document.querySelector('#next-preview');
  const ddmButton = document.querySelector('#ddm-button');
  const ddmCountEl = document.querySelector('#ddm-count');
  const rescuePanel = document.querySelector('.rescue-panel');
  const rescueHint = document.querySelector('#rescue-hint');
  const modeBanner = document.querySelector('#mode-banner');
  const toastEl = document.querySelector('#toast');
  const comboEl = document.querySelector('#combo-pop');
  const gameOverEl = document.querySelector('#game-over');
  const finalScoreEl = document.querySelector('#final-score');
  const finalHighestEl = document.querySelector('#final-highest');
  const debugChip = document.querySelector('#debug-chip');
  const themeOptionsEl = document.querySelector('#theme-options');
  const themeSwitcherEl = document.querySelector('#theme-switcher');
  const themeSelectors = new Map();
  const recipeBubbles = [...document.querySelectorAll('.recipe-bubble')];

  let engine;
  let entities = new Map();
  let timers = new Set();
  let particles = [];
  let score = 0;
  let best = readBest();
  let currentRunHighestLevel = 0;
  let currentRunMaxMergeCount = 0;
  const unlockedLevels = new Set();
  let ddmCount = INITIAL_DDM;
  let currentLevel = null;
  let nextLevel = randomDropLevel();
  let readyToDrop = true;
  let ddmMode = false;
  let ddmBusy = false;
  let gameOver = false;
  let lastFrame = 0;
  let gameTime = 0;
  let physicsAccumulator = 0;
  let isPointerInsidePlayfield = false;
  let pointerDownStartedInsidePlayfield = false;
  let activePointerId = null;
  let activePointerType = 'mouse';
  let lastValidDropX = PLAYFIELD_CENTER_X;
  let currentDropX = PLAYFIELD_CENTER_X;
  let dangerSince = null;
  let dangerLineWarning = false;
  let lastMergeTime = -Infinity;
  let comboCount = 0;
  let debugSide = 1;
  let toastTimer = null;
  let comboTimer = null;
  let resizeObserver;

  if (!window.Matter) {
    showToast('物理引擎載入失敗，請確認網路連線後重新整理。', 8000);
    ddmButton.disabled = true;
    return;
  }

  const { Engine, Bodies, Sleeping, Composite, Events } = Matter;
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

  bestEl.textContent = formatScore(best);
  debugChip.hidden = !DEBUG;
  initializeThemeSelector();
  updateScoreUI();
  updateDDMUI();
  updateJourneyUI();
  updateNextUI();
  resizeGame();
  resizeObserver = new ResizeObserver(resizeGame);
  resizeObserver.observe(wrapper);
  window.addEventListener('resize', resizeGame, { passive: true });
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
  ddmButton.addEventListener('click', toggleDDMMode);
  document.querySelector('#cancel-ddm').addEventListener('click', exitDDMMode);
  document.querySelector('#restart-button').addEventListener('click', restartGame);
  document.querySelector('#restart-top').addEventListener('click', restartGame);
  window.addEventListener('keydown', handleDebugKey);

  if (DEBUG) showToast('開發快捷鍵：1–8 放入等級 · D 補充 DDM · R 重開', 3600);
  requestAnimationFrame(frame);

  function randomDropLevel() {
    const poolMaxLevel = getSpawnPoolMaxLevel(currentRunHighestLevel);
    return 1 + Math.floor(Math.random() * poolMaxLevel);
  }

  function getSpawnPoolMaxLevel(highestReachedLevel) {
    if (highestReachedLevel >= 7) return 4;
    if (highestReachedLevel >= 5) return 3;
    return 2;
  }

  function readBest() {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
  }

  function writeBest(value) {
    try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* Storage may be unavailable in private contexts. */ }
  }

  function createWalls() {
    const wallHeight = PLAYFIELD_HEIGHT + WALL_EXTENSION;
    const wallCenterY = (GAME_FLOOR + GAME_TOP) / 2;
    const options = { isStatic: true, friction: 0.48, restitution: 0.18, label: 'bowl-wall' };
    const leftWall = Bodies.rectangle(GAME_LEFT - WALL_THICKNESS / 2, wallCenterY, WALL_THICKNESS, wallHeight, options);
    const rightWall = Bodies.rectangle(GAME_RIGHT + WALL_THICKNESS / 2, wallCenterY, WALL_THICKNESS, wallHeight, options);
    const floor = Bodies.rectangle((GAME_LEFT + GAME_RIGHT) / 2, GAME_FLOOR + WALL_THICKNESS / 2, GAME_RIGHT - GAME_LEFT + WALL_THICKNESS * 2, WALL_THICKNESS, options);
    Composite.add(engine.world, [leftWall, rightWall, floor]);
  }

  function createMelanin(level, x, y, options = {}) {
    const config = MELANIN_LEVELS[level];
    const radius = config.diameter / 2;
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
      radius,
      state: options.special ? 'special' : 'active',
      bornAt: gameTime,
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

  function unlockLevel(level) {
    if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL || unlockedLevels.has(level)) return;
    unlockedLevels.add(level);
    updateJourneyUI();
  }

  function registerReachedLevel(level) {
    unlockLevel(level);
    if (level > currentRunHighestLevel) {
      currentRunHighestLevel = level;
      updateScoreUI();
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
      selector.setAttribute('aria-label', '切換至' + theme.name);
      selector.dataset.themeName = theme.name;
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
    themeSwitcherEl?.setAttribute('aria-label', '球色系切換，目前為' + activeTheme.name);
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
    updateJourneyUI();
    draw();
  }
  function updateJourneyUI() {
    recipeBubbles.forEach((bubble, index) => {
      const level = MELANIN_LEVELS[index + 1];
      const isUnlocked = unlockedLevels.has(index + 1);
      bubble.style.backgroundColor = level.color;
      bubble.style.color = level.labelColor;
      bubble.classList.toggle('unlocked', isUnlocked);
      bubble.classList.toggle('locked', !isUnlocked);
    });
  }

  function spawnNextMelanin() {
    if (gameOver) return;
    currentLevel = nextLevel;
    const radius = MELANIN_LEVELS[currentLevel].diameter / 2;
    const spawnX = isPointerInsidePlayfield ? lastValidDropX : PLAYFIELD_CENTER_X;
    currentDropX = clamp(spawnX, GAME_LEFT + radius + 4, GAME_RIGHT - radius - 4);
    if (isPointerInsidePlayfield) lastValidDropX = currentDropX;
    registerReachedLevel(currentLevel);
    nextLevel = randomDropLevel();
    updateNextUI();
  }

  function updateNextUI() {
    if (currentLevel == null) spawnNextMelanin();
    nextEl.textContent = `LV ${nextLevel}`;
    nextPreviewEl.dataset.level = String(nextLevel);
    nextPreviewEl.setAttribute('aria-label', `下一顆：Lv ${nextLevel}`);
  }

  function getUIScale(frameWidth = wrapper.clientWidth) {
    return frameWidth / REFERENCE_WIDTH;
  }

  function updateDangerLineGeometry(uiScale) {
    // Drawing and Game Over use the same logical Y value; resize only changes its rendered scale.
    lv8Radius = MELANIN_LEVELS[DANGER_REFERENCE_LEVEL].diameter / 2;
    lv8Diameter = lv8Radius * 2;
    dangerZoneHeight = lv8Diameter * DANGER_ZONE_DIAMETER_MULTIPLIER;
    DANGER_LINE_Y = PLAYFIELD_BOTTOM - dangerZoneHeight;
    const debugKey = String(uiScale) + ':' + lv8Diameter;
    if (DEBUG && debugKey !== lastDangerDebugKey) {
      console.debug('[Melanin Merge] danger line geometry', {
        uiScale, playfieldHeight: PLAYFIELD_HEIGHT, playfieldBottom: PLAYFIELD_BOTTOM, lv8Radius,
        lv8Diameter, dangerZoneHeight, dangerLineY: DANGER_LINE_Y
      });
      lastDangerDebugKey = debugKey;
    }
  }

  function getLayoutMetrics() {
    const frameRect = wrapper.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / LOGICAL_WIDTH;
    const scaleY = canvasRect.height / LOGICAL_HEIGHT;
    const playfieldRect = {
      left: canvasRect.left + GAME_LEFT * scaleX,
      top: canvasRect.top + (GAME_TOP - BOWL_TOP_PADDING) * scaleY,
      right: canvasRect.left + GAME_RIGHT * scaleX,
      bottom: canvasRect.top + PLAYFIELD_BOTTOM * scaleY
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

  function isPointInsidePlayfield(clientX, clientY) {
    const { playfieldRect } = getLayoutMetrics();
    return clientX >= playfieldRect.left
      && clientX <= playfieldRect.right
      && clientY >= playfieldRect.top
      && clientY <= playfieldRect.bottom;
  }

  function handlePointerMove(event) {
    if (!isPointInsidePlayfield(event.clientX, event.clientY)) {
      isPointerInsidePlayfield = false;
      return;
    }
    updateDropPreviewPosition(toLogicalPoint(event));
  }

  function handlePointerLeave() {
    isPointerInsidePlayfield = false;
  }

  function handlePointerDown(event) {
    if (gameOver || activePointerId != null || event.button !== 0) return;
    activePointerId = event.pointerId;
    activePointerType = event.pointerType || 'mouse';
    pointerDownStartedInsidePlayfield = isPointInsidePlayfield(event.clientX, event.clientY);
    if (!pointerDownStartedInsidePlayfield) {
      isPointerInsidePlayfield = false;
      return;
    }
    event.preventDefault();
    updateDropPreviewPosition(toLogicalPoint(event));
  }

  function handlePointerUp(event) {
    if (activePointerId !== event.pointerId) return;
    const startedInside = pointerDownStartedInsidePlayfield;
    const endedInside = isPointInsidePlayfield(event.clientX, event.clientY);
    const pointerType = activePointerType;
    resetPointerGesture();
    if (!endedInside) isPointerInsidePlayfield = false;
    if (!startedInside || !endedInside || gameOver) return;

    event.preventDefault();
    const point = toLogicalPoint(event);
    updateDropPreviewPosition(point);
    if (ddmMode) {
      const target = findMelaninAt(point.x, point.y);
      if (target) useDDM(target);
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
    const radius = MELANIN_LEVELS[currentLevel].diameter / 2;
    lastValidDropX = clamp(point.x, GAME_LEFT + radius + 4, GAME_RIGHT - radius - 4);
    currentDropX = lastValidDropX;
  }

  function toLogicalPoint(event) {
    const { canvasRect, scaleX, scaleY } = getLayoutMetrics();
    if (!scaleX || !scaleY) return { x: PLAYFIELD_CENTER_X, y: GAME_TOP };
    return {
      x: (event.clientX - canvasRect.left) / scaleX,
      y: (event.clientY - canvasRect.top) / scaleY
    };
  }

  function dropMelanin(x, pointerType = 'mouse') {
    if (gameOver || ddmMode || !readyToDrop || currentLevel == null) return;
    const level = currentLevel;
    const radius = MELANIN_LEVELS[level].diameter / 2;
    createMelanin(level, clamp(x, GAME_LEFT + radius + 3, GAME_RIGHT - radius - 3), DROP_Y + radius, {});
    readyToDrop = false;
    currentLevel = null;
    // Touch has no hover position to carry forward; each newly prepared piece starts centered.
    if (pointerType === 'touch') isPointerInsidePlayfield = false;
    spawnNextMelanin();
    schedule(() => {
      if (!gameOver) readyToDrop = true;
    }, DROP_COOLDOWN);
  }

  function handleCollision(event) {
    if (gameOver) return;
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
      const next = first.level + 1;
      schedule(() => mergeMelanin(first, second, next, x, y), MERGE_DELAY);
    }
  }

  function mergeMelanin(first, second, nextLevelValue, x, y) {
    if (gameOver || !entities.has(first.body.id) || !entities.has(second.body.id)) return;
    removeEntity(first, false);
    removeEntity(second, false);
    wakeAllMelaninBodies();
    addScore(SCORE_TABLE[first.level] || 0);
    registerCombo();
    const radius = MELANIN_LEVELS[nextLevelValue].diameter / 2;
    const safeX = clamp(x, GAME_LEFT + radius + 2, GAME_RIGHT - radius - 2);
    const safeY = clamp(y, GAME_TOP + radius + 4, GAME_FLOOR - radius - 4);
    if (nextLevelValue === MAX_LEVEL) {
      handleMaxMelanin(safeX, safeY);
      return;
    }
    const result = createMelanin(nextLevelValue, safeX, safeY);
    result.popFrom = gameTime;
    emitParticles(safeX, safeY, '#efc782', 9);
  }

  function handleMaxMelanin(x, y) {
    addScore(MAX_MELANIN_BONUS);
    const maxBlob = createMelanin(MAX_LEVEL, x, y, { special: true });
    maxBlob.completionCounted = false;
    maxBlob.stateAt = gameTime;
    emitParticles(x, y, '#f6d68e', 25);
    showToast('成功淡化！　Lv 9 完成目標', 1500, true);
    schedule(() => {
      if (!entities.has(maxBlob.body.id) || maxBlob.completionCounted) return;
      if (!removeEntity(maxBlob)) return;
      maxBlob.completionCounted = true;
      const wasFull = ddmCount >= MAX_DDM;
      addDDM();
      currentRunMaxMergeCount += 1;
      if (wasFull) showToast('DDM 已補滿！', 1800, true);
      else showToast('DDM +1　淡化救援已補充', 1900, true);
      emitParticles(x, y, '#82d8bd', 19);
    }, MAX_PRESENTATION_DURATION);
  }

  function registerCombo() {
    if (gameTime - lastMergeTime <= COMBO_WINDOW) comboCount += 1;
    else comboCount = 1;
    lastMergeTime = gameTime;
    if (comboCount >= 2) {
      comboEl.textContent = `COMBO ×${comboCount}`;
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
      if (entity.level === MAX_LEVEL || entity.special) {
        showToast('最大黑色素需要透過合成完成淡化');
        return null;
      }
      if (state !== 'active') {
        showToast('這顆黑色素正在合成，等一下再試！');
        return null;
      }
      return entity;
    }
    return null;
  }

  function enterDDMMode() {
    if (gameOver || ddmBusy || ddmCount <= 0) return;
    ddmMode = true;
    canvas.classList.add('ddm-selecting');
    modeBanner.hidden = false;
    rescuePanel.classList.add('is-active');
    updateDDMUI();
  }

  function exitDDMMode() {
    ddmMode = false;
    canvas.classList.remove('ddm-selecting');
    modeBanner.hidden = true;
    rescuePanel.classList.remove('is-active');
    updateDDMUI();
  }

  function toggleDDMMode() {
    if (ddmMode) { exitDDMMode(); return; }
    if (ddmCount <= 0) { showToast('DDM 救援次數用完了，合成 Lv 9 來補充吧！'); return; }
    enterDDMMode();
  }

  function useDDM(target) {
    if (gameOver || ddmBusy || !entities.has(target.body.id)) return;
    if (target.level === MAX_LEVEL || target.special) {
      showToast('最大黑色素需要透過合成完成淡化');
      return;
    }
    if (target.state !== 'active' || ddmCount <= 0) return;
    target.state = 'removing';
    target.stateAt = gameTime;
    // Stop supporting or colliding immediately while the fade animation plays.
    target.body.isSensor = true;
    ddmBusy = true;
    ddmCount -= 1;
    exitDDMMode();
    updateDDMUI();
    wakeAllMelaninBodies();
    showToast('DDM 淡化中…');
    emitParticles(target.body.position.x, target.body.position.y, '#83d7bf', 12);
    schedule(() => {
      if (entities.has(target.body.id)) removeEntity(target);
      ddmBusy = false;
      updateDDMUI();
      showToast('空間整理好了，繼續合成吧！', 1400, true);
    }, DDM_FADE_DURATION);
  }

  function addDDM() {
    const previous = ddmCount;
    ddmCount = Math.min(MAX_DDM, ddmCount + 1);
    updateDDMUI();
    return ddmCount > previous;
  }

  function updateDDMUI() {
    ddmCountEl.textContent = `× ${ddmCount}`;
    ddmButton.disabled = ddmCount <= 0 || ddmBusy || gameOver;
    ddmButton.classList.toggle('is-active', ddmMode);
    ddmButton.setAttribute('aria-pressed', String(ddmMode));
    rescuePanel.classList.toggle('is-active', ddmMode);
    rescueHint.textContent = ddmMode ? '再次點擊按鈕即可取消' : ddmCount <= 0 ? `合成 Lv ${MAX_LEVEL} 可補充 DDM` : '點擊後選擇場上的黑色素';
  }

  function addScore(points) {
    score += points;
    if (score > best) {
      best = score;
      writeBest(best);
    }
    updateScoreUI();
  }

  function updateScoreUI() {
    scoreEl.textContent = formatScore(score);
    bestEl.textContent = formatScore(best);
    highestEl.textContent = `LV ${currentRunHighestLevel}`;
  }

  function formatScore(value) {
    return Math.floor(value).toLocaleString('en-US');
  }

  function showToast(message, duration = 1450, success = false) {
    toastEl.textContent = message;
    toastEl.classList.toggle('toast-success', success);
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, duration);
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
    const isInDanger = [...entities.values()].some((entity) => {
      if (entity.level >= MAX_LEVEL || entity.special || entity.state !== 'active') return false;
      if (gameTime - entity.bornAt < 1450) return false;
      return entity.body.position.y - entity.radius < DANGER_LINE_Y;
    });
    if (!isInDanger) {
      dangerSince = null;
      dangerLineWarning = false;
      return;
    }
    if (dangerSince == null) {
      dangerSince = gameTime;
      dangerLineWarning = true;
    }
    if (gameTime - dangerSince >= GAME_OVER_DELAY) triggerGameOver();
  }

  function getGameOverMessage() {
    if (currentRunMaxMergeCount >= 2) return '多次完成最高等級！下次再刷新你的紀錄吧！';
    if (currentRunMaxMergeCount === 1) return '最高等級已完成！下次挑戰更多次吧！';
    return '休息一下，再來挑戰最高等級吧。';
  }

  function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    dangerSince = null;
    dangerLineWarning = false;
    resetPointerGesture();
    isPointerInsidePlayfield = false;
    // Timed clean-up still runs (for example, an already-earned Lv 9 reward).
    // Any pending drop checks gameOver before preparing a new piece; restartGame clears all timers.
    ddmMode = false;
    ddmBusy = false;
    modeBanner.hidden = true;
    canvas.classList.remove('ddm-selecting');
    finalScoreEl.textContent = formatScore(score);
    finalHighestEl.textContent = `LV ${currentRunHighestLevel}`;
    document.querySelector('.over-copy').textContent = getGameOverMessage();
    gameOverEl.hidden = false;
    updateDDMUI();
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
    score = 0;
    currentRunHighestLevel = 0;
    unlockedLevels.clear();
    currentRunMaxMergeCount = 0;
    ddmCount = INITIAL_DDM;
    currentLevel = null;
    nextLevel = randomDropLevel();
    isPointerInsidePlayfield = false;
    resetPointerGesture();
    lastValidDropX = PLAYFIELD_CENTER_X;
    currentDropX = PLAYFIELD_CENTER_X;
    readyToDrop = true;
    ddmMode = false;
    ddmBusy = false;
    gameOver = false;
    dangerSince = null;
    dangerLineWarning = false;
    lastMergeTime = -Infinity;
    comboCount = 0;
    gameTime = 0;
    physicsAccumulator = 0;
    comboEl.hidden = true;
    toastEl.hidden = true;
    modeBanner.hidden = true;
    gameOverEl.hidden = true;
    canvas.classList.remove('ddm-selecting');
    createWalls();
    updateDDMUI();
    updateScoreUI();
    updateJourneyUI();
    updateNextUI();
  }

  function handleDebugKey(event) {
    if (!DEBUG || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const targetName = event.target?.tagName;
    if (targetName === 'INPUT' || targetName === 'TEXTAREA' || event.target?.isContentEditable) return;
    if (event.key.toLowerCase() === 'r') { restartGame(); return; }
    if (event.key.toLowerCase() === 'd') {
      const before = ddmCount;
      addDDM();
      showToast(before < ddmCount ? `DDM +1　目前 ×${ddmCount}` : 'DDM 已補滿！', 1250, before < ddmCount);
      return;
    }
    const level = Number(event.key);
    if (level >= 1 && level < MAX_LEVEL) debugSpawn(level);
  }

  function debugSpawn(level) {
    if (gameOver) return;
    const radius = MELANIN_LEVELS[level].diameter / 2;
    const x = LOGICAL_WIDTH / 2 + debugSide * Math.min(radius * 0.62, 52);
    debugSide *= -1;
    const entity = createMelanin(level, clamp(x, GAME_LEFT + radius + 4, GAME_RIGHT - radius - 4), Math.round(LOGICAL_HEIGHT * LAYOUT.debugSpawnY));
    entity.bornAt = gameTime - 1500;
    showToast(`DEBUG：放入 Lv ${level}`, 900);
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
    canvas.width = Math.round(LOGICAL_WIDTH * renderScale);
    canvas.height = Math.round(LOGICAL_HEIGHT * renderScale);
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    resizeNextPreview();
    // Matter.js stays in the normalized reference frame; the 16:9 wrapper scales visuals and collisions together.
    // Resizing only refreshes render metrics, so score, bodies, DDM, theme, and progress remain untouched.
  }

  function resizeNextPreview() {
    if (!nextPreviewCanvas || !nextPreviewCtx) return;
    const rect = nextPreviewCanvas.getBoundingClientRect();
    const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    nextPreviewCanvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
    nextPreviewCanvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
    nextPreviewCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function frame(now) {
    const delta = lastFrame ? Math.min(MAX_FRAME_DELTA, Math.max(0, now - lastFrame)) : PHYSICS_TIMESTEP;
    lastFrame = now;
    if (!gameOver) {
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
    draw();
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

  function draw() {
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
      if (ddmMode && entity.state === 'active' && entity.level < MAX_LEVEL) drawSelectableRing(x, y, entity.radius);
    }
  }

  function drawSelectableRing(x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius + 7, 0, Math.PI * 2);
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(95, 190, 161, .76)';
    ctx.stroke();
    ctx.restore();
  }

  function drawDropPreview() {
    if (gameOver || currentLevel == null) return;
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
    } else if (['proud', 'confident', 'boss'].includes(config.face)) {
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
    if (config.face === 'boss') drawMiniCrown(x, y - r * .55, r, ctx);
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
    if (config.face === 'calm' || config.face === 'gentle' || config.face === 'boss') curve = r * .08;

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

  function drawMiniCrown(x, baseY, r, renderContext = ctx) {
    const ctx = renderContext;
    const width = r * .38;
    const height = r * .15;
    const left = x - width / 2;
    const right = x + width / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, baseY);
    ctx.lineTo(left + width * .08, baseY - height * .58);
    ctx.lineTo(left + width * .32, baseY - height * .16);
    ctx.lineTo(x, baseY - height);
    ctx.lineTo(left + width * .68, baseY - height * .16);
    ctx.lineTo(right - width * .08, baseY - height * .58);
    ctx.lineTo(right, baseY);
    ctx.closePath();
    ctx.fillStyle = '#FFD77E';
    ctx.strokeStyle = '#D79165';
    ctx.lineWidth = Math.max(1.2, r * .025);
    ctx.fill();
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

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function easeOutCubic(value) { return 1 - (1 - value) ** 3; }
  function easeOutBack(value) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2; }
})();
