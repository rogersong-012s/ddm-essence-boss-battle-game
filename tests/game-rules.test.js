const assert = require('node:assert/strict');
const test = require('node:test');

global.window = globalThis;
require('../js/danger-zone.js');
require('../js/skills.js');
require('../js/renderer.js');

const { hasDangerOccupant, createDangerTimer } = DDMGameDangerZone;
const { chooseMaxRewardSkill } = DDMGameSkills;
const { calculateNextPreviewRadius } = DDMGameRenderer;
const DANGER_MS = 3600;
const DANGER_LINE_Y = 100;
const MAX_LEVEL = 9;

function ball(id, { y = 80, level = 1, bornAt = -2000, dangerBornAt = bornAt, radius = 20, state = 'active', special = false } = {}) {
  return [id, { level, bornAt, dangerBornAt, radius, state, special, body: { position: { y } } }];
}

function dangerStatus(timer, balls, timeMs) {
  const occupied = hasDangerOccupant(balls.values(), timeMs, DANGER_LINE_Y, MAX_LEVEL);
  return timer.update(occupied, timeMs);
}

test('danger timer persists across different balls while the zone remains occupied', () => {
  const timer = createDangerTimer(DANGER_MS);
  assert.equal(dangerStatus(timer, new Map([ball('A')]), 0).startedAt, 0);
  assert.equal(dangerStatus(timer, new Map([ball('A'), ball('B')]), 2000).elapsedMs, 2000);
  assert.equal(dangerStatus(timer, new Map([ball('B')]), 3599).expired, false);
  assert.equal(dangerStatus(timer, new Map([ball('B')]), 3600).expired, true);
});

test('an empty danger zone resets the timer and the next ball gets a full 3.6 seconds', () => {
  const timer = createDangerTimer(DANGER_MS);
  assert.equal(dangerStatus(timer, new Map([ball('A')]), 0).startedAt, 0);
  assert.deepEqual(dangerStatus(timer, new Map(), 2000), {
    occupied: false, startedAt: null, elapsedMs: 0, expired: false
  });

  const secondBall = new Map([ball('B', { bornAt: 1050 })]);
  assert.equal(dangerStatus(timer, secondBall, 2500).startedAt, 2500);
  assert.equal(dangerStatus(timer, secondBall, 6099).expired, false);
  assert.equal(dangerStatus(timer, secondBall, 6100).expired, true);
});

test('multiple danger balls still advance the single aggregate timer once', () => {
  const timer = createDangerTimer(DANGER_MS);
  const balls = new Map([ball('A'), ball('B'), ball('C')]);
  assert.equal(dangerStatus(timer, balls, 0).elapsedMs, 0);
  assert.equal(dangerStatus(timer, balls, 1800).elapsedMs, 1800);
  assert.equal(dangerStatus(timer, balls, 3599).expired, false);
  assert.equal(dangerStatus(timer, balls, 3600).expired, true);
});

test('merge-in-progress balls preserve logical danger occupancy and inherited age across merge chains', () => {
  const timer = createDangerTimer(DANGER_MS);
  const [idA, a] = ball('A');
  assert.equal(dangerStatus(timer, new Map([[idA, a]]), 0).startedAt, 0);
  a.state = 'merging';
  assert.equal(dangerStatus(timer, new Map([[idA, a]]), 1000).elapsedMs, 1000);

  const [idB, b] = ball('B', { bornAt: 1000, dangerBornAt: a.dangerBornAt });
  assert.equal(dangerStatus(timer, new Map([[idB, b]]), 1500).startedAt, 0);
  b.state = 'merging';
  const [idC, c] = ball('C', { bornAt: 1600, dangerBornAt: b.dangerBornAt });
  assert.equal(dangerStatus(timer, new Map([[idC, c]]), 3599).expired, false);
  assert.equal(dangerStatus(timer, new Map([[idC, c]]), 3600).expired, true);
});

test('only eligible active, non-MAX gameplay balls occupy the danger zone', () => {
  const ignored = new Map([
    ball('preview', { y: 80, state: 'preview' }),
    ball('young', { y: 80, bornAt: 600 }),
    ball('young-merging', { y: 80, bornAt: 600, state: 'merging' }),
    ball('special', { y: 80, special: true }),
    ball('max', { y: 80, level: MAX_LEVEL })
  ]);
  assert.equal(hasDangerOccupant(ignored.values(), 2000, DANGER_LINE_Y, MAX_LEVEL), false);
  assert.equal(hasDangerOccupant([ball('merging', { y: 80, state: 'merging' })[1]], 2000, DANGER_LINE_Y, MAX_LEVEL), true);
  assert.equal(hasDangerOccupant([ball('boundary', { y: 120 })[1]], 2000, DANGER_LINE_Y, MAX_LEVEL), false);
  assert.equal(hasDangerOccupant([ball('active')[1]], 2000, DANGER_LINE_Y, MAX_LEVEL), true);
});

test('WHITE SCORE MAX rewards only DDM and stop at its cap', () => {
  assert.equal(chooseMaxRewardSkill(2, 0, 4, 1, 'whiteScore', () => .99), 'ddm');
  assert.equal(chooseMaxRewardSkill(3, 0, 4, 1, 'whiteScore', () => .99), 'ddm');
  assert.equal(chooseMaxRewardSkill(4, 0, 4, 1, 'whiteScore', () => .99), null);
  assert.equal(chooseMaxRewardSkill(4, 1, 4, 1, 'whiteScore', () => .99), null);
});

test('Boss MAX rewards retain random selection and fill the available skill', () => {
  assert.equal(chooseMaxRewardSkill(1, 0, 4, 1, 'boss', () => 0), 'ddm');
  assert.equal(chooseMaxRewardSkill(1, 0, 4, 1, 'boss', () => .99), 'ssw');
  assert.equal(chooseMaxRewardSkill(4, 0, 4, 1, 'boss', () => .99), 'ssw');
  assert.equal(chooseMaxRewardSkill(1, 1, 4, 1, 'boss', () => 0), 'ddm');
  assert.equal(chooseMaxRewardSkill(4, 1, 4, 1, 'boss', () => 0), null);
});

test('NEXT preview matches base size at +0, ignores +10 player scaling, and fits Lv9', () => {
  const levels = Array.from({ length: 10 }, (_, level) => ({ diameter: [0, 36, 52, 72, 96, 124, 158, 198, 244, 298][level] }));
  const compactUiScale = .509;
  const canvasSize = (uiScale) => 1600 * .191 * uiScale;
  const previewDiameter = (level, uiScale) => calculateNextPreviewRadius(level, canvasSize(uiScale), canvasSize(uiScale), levels, uiScale) * 2;
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} should be near ${expected}`);

  for (let level = 1; level < levels.length; level += 1) {
    near(previewDiameter(level, 1), levels[level].diameter);
    near(previewDiameter(level, compactUiScale), levels[level].diameter * compactUiScale);
    if (level > 1) assert.ok(previewDiameter(level, 1) > previewDiameter(level - 1, 1));
  }
  const level2BaseDiameter = levels[2].diameter;
  const playerPlusTenScale = .8;
  const previewAtCompactViewport = previewDiameter(2, compactUiScale);
  const playerPlusTenDropDiameter = level2BaseDiameter * compactUiScale * playerPlusTenScale;
  near(previewAtCompactViewport, level2BaseDiameter * compactUiScale);
  near(playerPlusTenDropDiameter, 21.1744);
  assert.ok(previewAtCompactViewport > playerPlusTenDropDiameter);

  for (const uiScale of [1, compactUiScale]) {
    const lv9Diameter = previewDiameter(9, uiScale);
    near(lv9Diameter, levels[9].diameter * uiScale);
    assert.ok(lv9Diameter <= canvasSize(uiScale) * .98);
  }
  assert.equal(calculateNextPreviewRadius(5, 0, 80, levels, 1), 0);
});
