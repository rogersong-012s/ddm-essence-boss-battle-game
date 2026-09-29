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

  const MOBILE_REFERENCE_WIDTH = 430;
  const MOBILE_REFERENCE_HEIGHT = 932;
  const MOBILE_LAYOUT = Object.freeze({
    referenceFrame: Object.freeze({ width: MOBILE_REFERENCE_WIDTH, height: MOBILE_REFERENCE_HEIGHT }),
    playfield: Object.freeze({ x: 35 / MOBILE_REFERENCE_WIDTH, y: 295 / MOBILE_REFERENCE_HEIGHT, width: 360 / MOBILE_REFERENCE_WIDTH, height: 493 / MOBILE_REFERENCE_HEIGHT }),
    dropOffset: LAYOUT.dropOffset,
    bowlPadding: Object.freeze({ side: LAYOUT.bowlPadding.side, top: 0, bottom: LAYOUT.bowlPadding.bottom }),
    walls: LAYOUT.walls,
    ballDiameterRatios: LAYOUT.ballDiameterRatios,
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

  function createRuntimeLayout(mode = 'desktop') {
    const layout = mode === 'mobile' ? MOBILE_LAYOUT : LAYOUT;
    const logicalWidth = layout.referenceFrame.width;
    const logicalHeight = layout.referenceFrame.height;
    const playfieldWidth = Math.round(logicalWidth * layout.playfield.width);
    const playfieldHeight = Math.round(logicalHeight * layout.playfield.height);
    const gameLeft = Math.round(logicalWidth * layout.playfield.x);
    const gameRight = gameLeft + playfieldWidth;
    const gameTop = Math.round(logicalHeight * layout.playfield.y);
    const gameFloor = gameTop + playfieldHeight;
    const bowlBottomPadding = Math.round(playfieldHeight * layout.bowlPadding.bottom);

    return Object.freeze({
      mode,
      LAYOUT: layout,
      LOGICAL_WIDTH: logicalWidth,
      LOGICAL_HEIGHT: logicalHeight,
      PLAYFIELD_WIDTH: playfieldWidth,
      PLAYFIELD_HEIGHT: playfieldHeight,
      GAME_LEFT: gameLeft,
      GAME_RIGHT: gameRight,
      PLAYFIELD_CENTER_X: (gameLeft + gameRight) / 2,
      GAME_TOP: gameTop,
      GAME_FLOOR: gameFloor,
      DROP_Y: gameTop + Math.round(playfieldHeight * layout.dropOffset),
      WALL_THICKNESS: Math.round(playfieldWidth * layout.walls.thickness),
      WALL_EXTENSION: Math.round(playfieldHeight * layout.walls.extension),
      BOWL_SIDE_PADDING: Math.round(playfieldWidth * layout.bowlPadding.side),
      BOWL_TOP_PADDING: Math.round(playfieldHeight * layout.bowlPadding.top),
      BOWL_BOTTOM_PADDING: bowlBottomPadding,
      PLAYFIELD_BOTTOM: gameFloor + bowlBottomPadding,
      DANGER_LABEL_FONT_SIZE: mode === 'mobile' ? 12 : logicalWidth * (14 / REFERENCE_WIDTH)
    });
  }

  function ballDiameterForLevel(level, playfieldWidth = PLAYFIELD_WIDTH) {
    return Math.round(playfieldWidth * LAYOUT.ballDiameterRatios[level]);
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
  const PLAYER_CONFIG = Object.freeze({ image: 'assets/characters/player/JF.png' });
  const WHITE_SCORE_DROP_LEVELS = Object.freeze([1, 2, 3, 4, 5]);
  const BOSS_CONFIG = Object.freeze({
    bosses: Object.freeze([
      Object.freeze({ name: 'A', displayName: '乾燥妖精', image: 'assets/characters/bosses/boss1.png', maxHp: 3000 }),
      Object.freeze({ name: 'B', displayName: '角質魔女', image: 'assets/characters/bosses/boss2.png', maxHp: 5000 }),
      Object.freeze({ name: 'C', displayName: '糖化甜姬', image: 'assets/characters/bosses/boss3.png', maxHp: 8000 }),
      Object.freeze({ name: 'D', displayName: '氧化女王', image: 'assets/characters/bosses/boss4.png', maxHp: 15000 }),
      Object.freeze({ name: 'E', displayName: '光老女帝', image: 'assets/characters/bosses/boss5.png', maxHp: 25000 })
    ]),
    transitionDuration: 1800,
    projectileTravelDuration: 460,
    impactDuration: 360,
    hitReactionDuration: 270
  });

  global.DDMGameConfig = Object.freeze({
    DEBUG: false,
    REFERENCE_WIDTH,
    REFERENCE_HEIGHT,
    DANGER_ZONE_DIAMETER_MULTIPLIER,
    LAYOUT,
    MOBILE_LAYOUT,
    MOBILE_REFERENCE_WIDTH,
    MOBILE_REFERENCE_HEIGHT,
    createRuntimeLayout,
    LOGICAL_WIDTH,
    LOGICAL_HEIGHT,
    PLAYFIELD_WIDTH,
    PLAYFIELD_HEIGHT,
    ballDiameterForLevel,
    SKILL_CONFIG,
    PLAYER_MAX_LEVEL,
    BALL_SIZE_REDUCTION_PER_PLAYER_LEVEL,
    PLAYER_CONFIG,
    CHARACTER_IMAGE_FALLBACK_DELAY_MS: 1500,
    WHITE_SCORE_DROP_LEVELS,
    DROP_DAMAGE: 10,
    DANGER_DURATION_MS: 3600,
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
