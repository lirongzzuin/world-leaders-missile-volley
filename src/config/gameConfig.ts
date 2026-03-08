/**
 * Central game configuration.
 * ALL gameplay-affecting numbers live here — never hardcode in game logic.
 *
 * @module gameConfig
 */

import type { Arena } from '@/types/game';

// ─── Canvas / Arena ───────────────────────────────────────────────────────────

/** Game world width in virtual pixels (rendered scaled to actual canvas) */
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;

/** Y coordinate of the court floor */
export const FLOOR_Y = 400;

/** Net geometry (center of canvas) */
export const NET: Arena['net'] = {
  x: CANVAS_WIDTH / 2 - 4,
  y: 240,
  width: 8,
  height: FLOOR_Y - 240,
};

export const ARENA: Arena = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  floorY: FLOOR_Y,
  net: NET,
};

// ─── Physics ──────────────────────────────────────────────────────────────────

/** Frames-per-second target */
export const TARGET_FPS = 60;

/** Fixed physics step in seconds (1/60) */
export const PHYSICS_STEP = 1 / TARGET_FPS;

/** Base gravity applied to characters (game-units/frame²) */
export const CHAR_GRAVITY = 0.55;

/** Character hitbox radius in game-units */
export const CHAR_RADIUS = 30;

/** Character body height for rendering */
export const CHAR_HEIGHT = 70;

/** Base horizontal movement speed (game-units/frame) — scaled by stat */
export const BASE_MOVE_SPEED = 4.5;

/** Base jump initial vertical velocity (negative = upward) — scaled by stat */
export const BASE_JUMP_FORCE = -13;

/** Maximum horizontal speed a character can reach */
export const MAX_CHAR_SPEED = 8;

// ─── Missile ──────────────────────────────────────────────────────────────────

/** Missile collision radius */
export const MISSILE_RADIUS = 14;

/**
 * Base speed applied when a character hits the missile.
 * Actual speed = BASE_HIT_SPEED + (character.power - 1) * HIT_POWER_BONUS
 */
export const BASE_HIT_SPEED = 10;
export const HIT_POWER_BONUS = 2;

/** Maximum missile speed in any direction */
export const MAX_MISSILE_SPEED = 28;

/** Minimum upward velocity when a player hits the missile over the net */
export const MIN_HIT_VY = -6;

/** Serve height above character head */
export const SERVE_HEIGHT_ABOVE_CHAR = 60;

// ─── Scoring ──────────────────────────────────────────────────────────────────

/** Points to win a set */
export const POINTS_PER_SET = 5;

/** Sets to win the match */
export const SETS_TO_WIN = 3;

// ─── Effects ──────────────────────────────────────────────────────────────────

/** How many trail particles to spawn per frame when missile is moving */
export const TRAIL_PARTICLES_PER_FRAME = 3;

/** Max lifetime of a trail particle (frames) */
export const TRAIL_PARTICLE_LIFETIME = 20;

/** Number of explosion particles on impact */
export const EXPLOSION_PARTICLE_COUNT = 40;

/** Max lifetime of explosion particles (frames) */
export const EXPLOSION_PARTICLE_LIFETIME = 30;

/** Default screen shake on missile impact */
export const DEFAULT_SHAKE_INTENSITY = 6;
export const DEFAULT_SHAKE_DURATION_FRAMES = 15;

/** Score flash duration (frames) */
export const SCORE_FLASH_DURATION = 20;

// ─── AI ───────────────────────────────────────────────────────────────────────

export const AI_CONFIG = {
  easy: {
    reactionDelayFrames: 30,
    missThreshold: 0.3,      // probability of intentional miss per frame
    useSpecialThreshold: 0.05,
    speedMultiplier: 0.6,
  },
  normal: {
    reactionDelayFrames: 10,
    missThreshold: 0.05,
    useSpecialThreshold: 0.2,
    speedMultiplier: 0.85,
  },
  hard: {
    reactionDelayFrames: 2,
    missThreshold: 0.01,
    useSpecialThreshold: 0.5,
    speedMultiplier: 1.0,
  },
} as const;

// ─── Server / Room Limits ─────────────────────────────────────────────────────

/** Maximum simultaneous game rooms on the socket server */
export const MAX_ROOMS = 200;

/** Maximum players per room */
export const MAX_PLAYERS_PER_ROOM = 4;

/** Reconnect grace period before forfeit (seconds) */
export const RECONNECT_TIMEOUT_SEC = 30;

// ─── Matchmaking ──────────────────────────────────────────────────────────────

/** ELO range for matchmaking — expands by this amount every 10 seconds */
export const MATCHMAKING_ELO_BAND = 150;
export const MATCHMAKING_ELO_EXPAND_PER_TICK = 50;
export const MATCHMAKING_TICK_INTERVAL_SEC = 10;

/** Matchmaking queue TTL in Redis (seconds) */
export const MATCHMAKING_TTL_SEC = 5 * 60;

// ─── ELO ─────────────────────────────────────────────────────────────────────

export const ELO_INITIAL = 1000;
export const ELO_K_FACTOR = 32;
export const ELO_MIN_CHANGE = 10;
export const ELO_MAX_CHANGE = 30;

// ─── Session / Cache TTLs ────────────────────────────────────────────────────

export const SESSION_TTL_SEC = 30 * 24 * 60 * 60;   // 30 days
export const RANKING_CACHE_TTL_SEC = 5 * 60;          // 5 minutes
