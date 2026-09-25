(function (global) {
  'use strict';

  const REFERENCE_WIDTH = 1600;
  const REFERENCE_HEIGHT = 900;
  const DANGER_ZONE_DIAMETER_MULTIPLIER = 2.2;
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

  function ballDiameterForLevel(level) {
    return Math.round(PLAYFIELD_WIDTH * LAYOUT.ballDiameterRatios[level]);
  }

  const SKILL_CONFIG = Object.freeze({
    ddmInitialUses: 1,
    sswInitialUses: 1,
    ddmMaxUses: 4,
    sswMaxUses: 1,
    directDdmDamageMultiplier: 0.25
  });
  const PLAYER_MAX_LEVEL = 10;
  const BALL_SIZE_REDUCTION_PER_PLAYER_LEVEL = 0.02;
  const WHITE_SCORE_DROP_LEVELS = Object.freeze([1, 2, 3, 4, 5]);
  const BOSS_CONFIG = Object.freeze({
    bosses: Object.freeze([
      Object.freeze({ name: 'A', maxHp: 3000 }),
      Object.freeze({ name: 'B', maxHp: 5000 }),
      Object.freeze({ name: 'C', maxHp: 8000 }),
      Object.freeze({ name: 'D', maxHp: 15000 }),
      Object.freeze({ name: 'E', maxHp: 25000 })
    ]),
    transitionDuration: 1800,
    projectileTravelDuration: 460,
    impactDuration: 360,
    hitReactionDuration: 270
  });

  global.DDMGameConfig = Object.freeze({
    DEBUG: true,
    REFERENCE_WIDTH,
    REFERENCE_HEIGHT,
    DANGER_ZONE_DIAMETER_MULTIPLIER,
    LAYOUT,
    LOGICAL_WIDTH,
    LOGICAL_HEIGHT,
    PLAYFIELD_WIDTH,
    PLAYFIELD_HEIGHT,
    ballDiameterForLevel,
    SKILL_CONFIG,
    PLAYER_MAX_LEVEL,
    BALL_SIZE_REDUCTION_PER_PLAYER_LEVEL,
    WHITE_SCORE_DROP_LEVELS,
    DROP_DAMAGE: 10,
    DANGER_DURATION: 3600,
    CENTRAL_TOAST_DURATION_MULTIPLIER: 1.5,
    DROP_COOLDOWN: 520,
    PHYSICS_GRAVITY: 1,
    PHYSICS_GRAVITY_SCALE: 0.00105,
    PHYSICS_TIMESTEP: 1000 / 60,
    MAX_PHYSICS_STEPS_PER_FRAME: 3,
    MERGE_DELAY: 80,
    DDM_FADE_DURATION: 420,
    MAX_PRESENTATION_DURATION: 900,
    COMBO_WINDOW: 1200,
    MAX_MELANIN_BONUS: 1800,
    BOSS_CONFIG,
    SCORE_TABLE: Object.freeze({ 1: 5, 2: 10, 3: 20, 4: 40, 5: 80, 6: 160, 7: 320, 8: 640 }),
    GAME_LEFT,
    GAME_RIGHT,
    PLAYFIELD_CENTER_X,
    GAME_TOP,
    GAME_FLOOR,
    DROP_Y,
    WALL_THICKNESS,
    WALL_EXTENSION,
    BOWL_SIDE_PADDING,
    BOWL_TOP_PADDING,
    BOWL_BOTTOM_PADDING,
    PLAYFIELD_BOTTOM,
    MAX_FRAME_DELTA: 34,
    MAX_CANVAS_SCALE: 2.5,
    DANGER_LABEL_FONT_SIZE: LOGICAL_WIDTH * (14 / REFERENCE_WIDTH)
  });
})(window);
