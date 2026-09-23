(() => {
  'use strict';

  // ---------------------------
  // Tunable game configuration
  // ---------------------------
  const DEBUG = true;
  const LOGICAL_WIDTH = 1600;
  const LOGICAL_HEIGHT = 900;
  const PLAYFIELD_WIDTH = 460;
  const PLAYFIELD_HEIGHT = 630;
  const MAX_LEVEL = 9;
  const MAX_DDM = 3;
  const INITIAL_DDM = 3;
  const GAME_OVER_DELAY = 2000;
  const DANGER_LINE_OFFSET = 175;
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
  const MELANIN_LEVELS = [
    null,
    { diameter: 36, color: '#E8C5A7', highlight: '#FFF0DC', shadow: '#C89470', labelColor: '#694A36', badgeFill: 'rgba(255,250,239,.88)', faceColor: '#76543F', face: 'shy', faceScale: 0.98, eyeScale: 0.21, eyeHeightScale: 0.25, eyeOffset: 0.31, mouthScale: 0.22, labelFont: 9 },
    { diameter: 52, color: '#D59B76', highlight: '#F3CBA7', shadow: '#A96849', labelColor: '#68432F', badgeFill: 'rgba(255,247,229,.76)', faceColor: '#68432F', face: 'shy', faceScale: 1.1, eyeScale: 0.22, eyeHeightScale: 0.28, eyeOffset: 0.31, mouthScale: 0.25, labelFont: 12 },
    { diameter: 72, color: '#C4865E', highlight: '#EAB68F', shadow: '#8F5438', labelColor: '#FFF3E3', badgeFill: 'rgba(83,48,33,.26)', faceColor: '#FFF0D9', face: 'smile', faceScale: 1.09, eyeScale: 0.22, eyeHeightScale: 0.28, eyeOffset: 0.31, mouthScale: 0.25, labelFont: 13 },
    { diameter: 96, color: '#AA6D4B', highlight: '#D99D73', shadow: '#75422B', labelColor: '#FFF3E3', badgeFill: 'rgba(75,43,30,.28)', faceColor: '#FFE6C8', face: 'playful', faceScale: 1.08, eyeScale: 0.21, eyeHeightScale: 0.27, eyeOffset: 0.31, mouthScale: 0.25, labelFont: 14 },
    { diameter: 124, color: '#895638', highlight: '#BF8359', shadow: '#5B3522', labelColor: '#FFF2DF', badgeFill: 'rgba(56,34,23,.3)', faceColor: '#F7DAB8', face: 'proud', faceScale: 1.07, eyeScale: 0.2, eyeHeightScale: 0.26, eyeOffset: 0.31, mouthScale: 0.25, labelFont: 16 },
    { diameter: 158, color: '#68412D', highlight: '#A16D4B', shadow: '#402317', labelColor: '#FFF0D8', badgeFill: 'rgba(38,23,16,.34)', faceColor: '#F5D3AE', face: 'mischief', faceScale: 1.06, eyeScale: 0.2, eyeHeightScale: 0.26, eyeOffset: 0.31, mouthScale: 0.24, labelFont: 18 },
    { diameter: 198, color: '#4B3023', highlight: '#7D5339', shadow: '#29160F', labelColor: '#FFF0D8', badgeFill: 'rgba(25,15,10,.38)', faceColor: '#F2D1AC', face: 'bold', faceScale: 1.05, eyeScale: 0.2, eyeHeightScale: 0.26, eyeOffset: 0.31, mouthScale: 0.24, labelFont: 20 },
    { diameter: 244, color: '#321C14', highlight: '#69422D', shadow: '#170905', labelColor: '#FFF0D8', badgeFill: 'rgba(18,10,7,.42)', faceColor: '#F1D0AA', face: 'boss', faceScale: 1.08, eyeScale: 0.21, eyeHeightScale: 0.26, eyeOffset: 0.31, mouthScale: 0.24, labelFont: 22 },
    { diameter: 298, color: '#21100D', highlight: '#76513A', shadow: '#0D0504', labelColor: '#FFF1DC', badgeFill: 'rgba(12,7,6,.48)', faceColor: '#FFE0BD', face: 'crowned', faceScale: 1.12, eyeScale: 0.21, eyeHeightScale: 0.26, eyeOffset: 0.31, mouthScale: 0.24, labelFont: 24 }
  ];

  const GAME_LEFT = (LOGICAL_WIDTH - PLAYFIELD_WIDTH) / 2;
  const GAME_RIGHT = GAME_LEFT + PLAYFIELD_WIDTH;
  const GAME_TOP = 156;
  const GAME_FLOOR = GAME_TOP + PLAYFIELD_HEIGHT;
  const DANGER_LINE_Y = GAME_TOP + DANGER_LINE_OFFSET;
  const DROP_Y = GAME_TOP + 42;
  const WALL_THICKNESS = 26;
  const WALL_EXTENSION = 130;
  const BOWL_SIDE_PADDING = 27;
  const BOWL_TOP_PADDING = 21;
  const BOWL_BOTTOM_PADDING = 24;
  const MAX_FRAME_DELTA = 34;
  const MAX_CANVAS_SCALE = 2.5;
  const DANGER_LABEL_FONT_SIZE = 14;
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

  let engine;
  let entities = new Map();
  let timers = new Set();
  let particles = [];
  let score = 0;
  let best = readBest();
  let currentRunHighestLevel = 1;
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
  let pointerX = LOGICAL_WIDTH / 2;
  let pointerInside = false;
  let dangerSince = null;
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
  updateScoreUI();
  updateDDMUI();
  updateNextUI();
  resizeGame();
  resizeObserver = new ResizeObserver(resizeGame);
  resizeObserver.observe(wrapper);
  window.addEventListener('resize', resizeGame, { passive: true });
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointerleave', () => { pointerInside = false; });
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

  function getSpawnPoolMaxLevel(highestMergedLevel) {
    if (highestMergedLevel >= 7) return 4;
    if (highestMergedLevel >= 5) return 3;
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
    return entity;
  }

  function spawnNextMelanin() {
    if (gameOver) return;
    currentLevel = nextLevel;
    nextLevel = randomDropLevel();
    readyToDrop = true;
    updateNextUI();
  }

  function updateNextUI() {
    if (currentLevel == null) spawnNextMelanin();
    nextEl.textContent = `LV ${nextLevel}`;
    nextPreviewEl.dataset.level = String(nextLevel);
    nextPreviewEl.setAttribute('aria-label', `下一顆：Lv ${nextLevel}`);
  }

  function handlePointerMove(event) {
    const point = toLogicalPoint(event);
    pointerX = clamp(point.x, GAME_LEFT + 22, GAME_RIGHT - 22);
    pointerInside = point.x >= 0 && point.x <= LOGICAL_WIDTH && point.y >= 0 && point.y <= LOGICAL_HEIGHT;
  }

  function handlePointerDown(event) {
    if (gameOver) return;
    event.preventDefault();
    const point = toLogicalPoint(event);
    pointerX = clamp(point.x, GAME_LEFT + 22, GAME_RIGHT - 22);
    pointerInside = true;
    if (ddmMode) {
      const target = findMelaninAt(point.x, point.y);
      if (!target) return;
      useDDM(target);
      return;
    }
    dropMelanin(pointerX);
  }

  function toLogicalPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * LOGICAL_WIDTH / rect.width,
      y: (event.clientY - rect.top) * LOGICAL_HEIGHT / rect.height
    };
  }

  function dropMelanin(x) {
    if (gameOver || ddmMode || !readyToDrop || currentLevel == null) return;
    const level = currentLevel;
    const radius = MELANIN_LEVELS[level].diameter / 2;
    createMelanin(level, clamp(x, GAME_LEFT + radius + 3, GAME_RIGHT - radius - 3), DROP_Y + radius, {});
    readyToDrop = false;
    currentLevel = null;
    schedule(spawnNextMelanin, DROP_COOLDOWN);
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
    currentRunHighestLevel = Math.max(currentRunHighestLevel, nextLevelValue);
    updateScoreUI();
    emitParticles(safeX, safeY, '#efc782', 9);
  }

  function handleMaxMelanin(x, y) {
    addScore(MAX_MELANIN_BONUS);
    currentRunHighestLevel = MAX_LEVEL;
    const maxBlob = createMelanin(MAX_LEVEL, x, y, { special: true });
    maxBlob.stateAt = gameTime;
    updateScoreUI();
    emitParticles(x, y, '#f6d68e', 25);
    showToast('成功淡化！　Lv 9 完成目標', 1500, true);
    schedule(() => {
      if (!entities.has(maxBlob.body.id)) return;
      removeEntity(maxBlob);
      const wasFull = ddmCount >= MAX_DDM;
      addDDM();
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
      return;
    }
    if (dangerSince == null) dangerSince = gameTime;
    if (gameTime - dangerSince >= GAME_OVER_DELAY) triggerGameOver();
  }

  function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    dangerSince = null;
    // Timed clean-up still runs (for example, an already-earned Lv 9 reward).
    // Any pending drop checks gameOver before preparing a new piece; restartGame clears all timers.
    ddmMode = false;
    ddmBusy = false;
    modeBanner.hidden = true;
    canvas.classList.remove('ddm-selecting');
    finalScoreEl.textContent = formatScore(score);
    finalHighestEl.textContent = `LV ${currentRunHighestLevel}`;
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
    currentRunHighestLevel = 1;
    ddmCount = INITIAL_DDM;
    currentLevel = null;
    nextLevel = randomDropLevel();
    readyToDrop = true;
    ddmMode = false;
    ddmBusy = false;
    gameOver = false;
    dangerSince = null;
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
    const entity = createMelanin(level, clamp(x, GAME_LEFT + radius + 4, GAME_RIGHT - radius - 4), 610);
    entity.bornAt = gameTime - 1500;
    showToast(`DEBUG：放入 Lv ${level}`, 900);
  }

  function resizeGame() {
    if (!canvas || !ctx) return;
    const rect = wrapper.getBoundingClientRect();
    const deviceRatio = window.devicePixelRatio || 1;
    const renderScale = Math.max(1, Math.min(MAX_CANVAS_SCALE, deviceRatio * rect.width / LOGICAL_WIDTH));
    canvas.width = Math.round(LOGICAL_WIDTH * renderScale);
    canvas.height = Math.round(LOGICAL_HEIGHT * renderScale);
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    resizeNextPreview();
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
    const bottom = GAME_FLOOR + BOWL_BOTTOM_PADDING;
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
    ctx.setLineDash([9, 10]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(225, 124, 99, .82)';
    ctx.beginPath();
    ctx.moveTo(GAME_LEFT + 18, DANGER_LINE_Y);
    ctx.lineTo(GAME_RIGHT - 18, DANGER_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `700 ${DANGER_LABEL_FONT_SIZE}px "DM Sans", "Noto Sans TC", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const label = '危險線  ·  穩住 2 秒';
    const textWidth = ctx.measureText(label).width;
    roundedRect(ctx, GAME_LEFT + 23, DANGER_LINE_Y - 16, textWidth + 20, 31, 15);
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    ctx.fill();
    ctx.fillStyle = '#aa5b4d';
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
    if (gameOver || ddmMode || !readyToDrop || currentLevel == null || !pointerInside) return;
    const radius = MELANIN_LEVELS[currentLevel].diameter / 2;
    const x = clamp(pointerX, GAME_LEFT + radius + 4, GAME_RIGHT - radius - 4);
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
    ctx.strokeStyle = isSpecial ? 'rgba(233,255,244,.8)' : 'rgba(255,239,219,.3)';
    ctx.stroke();

    // Tiny glossy highlight.
    ctx.beginPath();
    ctx.ellipse(x - r * .35, y - r * .47, r * .22, r * .105, -.55, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,245,220,.25)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - r * .52, y - r * .27, Math.max(1, r * .045), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,249,229,.46)';
    ctx.fill();

    drawFace(x, y, r, level, config, ctx);
    drawLevelBadge(x, y, r, level, config, ctx);
    if (isSpecial) drawMaxAura(x, y, r, specialAge, ctx);
    ctx.restore();
  }

  function drawFace(x, y, orbRadius, level, config, renderContext = ctx) {
    const ctx = renderContext;
    const r = orbRadius * config.faceScale;
    const eyeY = y - r * .12;
    const eyeX = r * config.eyeOffset;
    const eyeW = Math.max(3, r * config.eyeScale);
    const eyeH = Math.max(4, r * config.eyeHeightScale);
    const eyeModes = { shy: 'round', smile: 'round', playful: 'wink', proud: 'happy', mischief: 'mischief', bold: 'confident', boss: 'boss', crowned: 'boss' };
    const mode = eyeModes[config.face] || 'round';
    const eyeFill = '#fff0d9';
    const pupil = '#392725';
    ctx.save();
    if (mode === 'happy') {
      drawClosedEye(x - eyeX, eyeY, eyeW, eyeH, true, ctx);
      drawClosedEye(x + eyeX, eyeY, eyeW, eyeH, true, ctx);
    } else if (mode === 'boss') {
      drawClosedEye(x - eyeX, eyeY + 1, eyeW * 1.1, eyeH, false, ctx);
      drawClosedEye(x + eyeX, eyeY + 1, eyeW * 1.1, eyeH, false, ctx);
    } else {
      ctx.beginPath(); ctx.ellipse(x - eyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2); ctx.fillStyle = eyeFill; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + eyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - eyeX + eyeW * .12, eyeY + eyeH * .1, eyeW * .48, 0, Math.PI * 2); ctx.fillStyle = pupil; ctx.fill();
      if (mode === 'wink') {
        ctx.beginPath(); ctx.ellipse(x + eyeX, eyeY, eyeW * 1.12, Math.max(1.4, eyeH * .17), -.1, Math.PI, Math.PI * 2); ctx.strokeStyle = '#f7d7b9'; ctx.lineWidth = Math.max(1.7, r * .07); ctx.lineCap = 'round'; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x + eyeX + eyeW * .12, eyeY + eyeH * .1, eyeW * .48, 0, Math.PI * 2); ctx.fill();
      }
      if (mode === 'mischief' || mode === 'confident') {
        ctx.strokeStyle = '#462c2a'; ctx.lineWidth = Math.max(1.4, r * .065); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x + eyeX - eyeW, eyeY - eyeH * 1.18); ctx.lineTo(x + eyeX + eyeW * .85, eyeY - eyeH * .78); ctx.stroke();
      }
    }

    if (['shy', 'smile', 'playful', 'proud'].includes(config.face)) {
      ctx.fillStyle = 'rgba(239,151,137,.35)';
      ctx.beginPath(); ctx.ellipse(x - r * .51, y + r * .19, r * .115, r * .06, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + r * .51, y + r * .19, r * .115, r * .06, 0, 0, Math.PI * 2); ctx.fill();
    }

    const mouthY = y + r * .26;
    ctx.strokeStyle = config.faceColor;
    ctx.fillStyle = config.faceColor;
    ctx.lineWidth = Math.max(1.6, r * .07);
    ctx.lineCap = 'round';
    if (config.face === 'shy') {
      ctx.beginPath(); ctx.arc(x, mouthY, Math.max(2.5, r * .075), 0, Math.PI * 2); ctx.stroke();
    } else if (config.face === 'smile' || config.face === 'proud') {
      ctx.beginPath(); ctx.moveTo(x - r * config.mouthScale, mouthY - r * .025); ctx.quadraticCurveTo(x, mouthY + r * .16, x + r * config.mouthScale, mouthY - r * .025); ctx.stroke();
    } else if (config.face === 'playful') {
      ctx.beginPath(); ctx.moveTo(x - r * config.mouthScale, mouthY); ctx.quadraticCurveTo(x + r * .03, mouthY + r * .18, x + r * config.mouthScale, mouthY - r * .03); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + r * .07, mouthY + r * .16, r * .075, r * .08, 0, 0, Math.PI * 2); ctx.fillStyle = '#e99c8e'; ctx.fill();
    } else if (config.face === 'mischief') {
      ctx.beginPath(); ctx.moveTo(x - r * config.mouthScale, mouthY); ctx.quadraticCurveTo(x + r * .02, mouthY + r * .12, x + r * config.mouthScale, mouthY - r * .02); ctx.stroke();
    } else if (config.face === 'bold') {
      ctx.beginPath(); ctx.moveTo(x - r * config.mouthScale, mouthY); ctx.quadraticCurveTo(x, mouthY + r * .18, x + r * config.mouthScale, mouthY); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(x, mouthY, r * .12, r * .075, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - r * .2, eyeY - eyeH * 1.7); ctx.lineTo(x - r * .05, eyeY - eyeH * 2.4); ctx.lineTo(x + r * .08, eyeY - eyeH * 1.6); ctx.lineTo(x + r * .21, eyeY - eyeH * 2.1); ctx.strokeStyle = '#efd08f'; ctx.lineWidth = Math.max(1.5, r * .04); ctx.stroke();
    }
    ctx.restore();
  }

  function drawClosedEye(x, y, width, height, happy, renderContext = ctx) {
    const ctx = renderContext;
    ctx.beginPath();
    if (happy) {
      ctx.arc(x, y + height * .2, width * .8, Math.PI, Math.PI * 2);
    } else {
      ctx.moveTo(x - width, y);
      ctx.quadraticCurveTo(x, y + height * .45, x + width, y);
    }
    ctx.strokeStyle = '#fff0d9';
    ctx.lineWidth = Math.max(1.8, width * .45);
    ctx.lineCap = 'round';
    ctx.stroke();
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
