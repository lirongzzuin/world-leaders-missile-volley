/**
 * Core game type definitions.
 * All game state, physics objects, and character/missile configs live here.
 */

// ─── Missile ────────────────────────────────────────────────────────────────

export interface MissileConfig {
  id: string;
  /** Display name: e.g. "ICBM", "Hypersonic", "Cruise" */
  name: string;
  /** Sprite path (falls back to SVG render if absent) */
  sprite?: string;
  /** Gravity acceleration in game-units/frame² */
  gravity: number;
  /** Air resistance coefficient per frame (0–1, smaller = less drag) */
  drag: number;
  /** Elasticity on bounce (0 = no bounce, 1 = perfect bounce) */
  restitution: number;
  /** Flame particle trail colors [start, end] */
  trailColor: [string, string];
  /** Explosion radius in game-units */
  explosionRadius: number;
  /** Canvas shake intensity on ground impact */
  hitShakeIntensity: number;
  /** Speed multiplier applied when this missile type is hit */
  speedMultiplier: number;
}

export interface MissileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Rotation angle in radians (auto-computed from velocity) */
  rotation: number;
  config: MissileConfig;
  /** Who last touched it — used for scoring */
  lastTouchedBy: 0 | 1 | null;
  active: boolean;
}

// ─── Character ──────────────────────────────────────────────────────────────

export type CharacterType = 'power' | 'speed' | 'tech' | 'defense' | 'balanced';

export interface CharacterStats {
  /** Movement speed 1–5 */
  speed: number;
  /** Jump height 1–5 */
  jump: number;
  /** Hit power 1–5 */
  power: number;
}

export interface SpecialMove {
  name: string;
  description: string;
  /** Cooldown in seconds */
  cooldown: number;
  /** When active, override missile physics with these values */
  missileOverride?: Partial<MissileConfig>;
  /**
   * Pure function: given current game state, returns the next game state.
   * Must NOT mutate the input.
   */
  execute: (state: GameState) => GameState;
}

export interface CharacterColors {
  primary: string;
  accent: string;
  /** Trail color of missiles this character hits */
  missileTrail: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  country: string;
  /** Flag emoji */
  flag: string;
  type: CharacterType;
  stats: CharacterStats;
  special: SpecialMove;
  colors: CharacterColors;
  emotes: {
    win: string;
    lose: string;
  };
}

export interface CharacterState {
  id: string;
  /** Config reference */
  config: CharacterConfig;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 = facing right, 1 = facing left */
  facingLeft: boolean;
  isGrounded: boolean;
  isJumping: boolean;
  specialCooldownRemaining: number;
  isSpecialActive: boolean;
  shieldActive: boolean;
  /** Shield expires at this timestamp */
  shieldExpiresAt: number;
  hitFlashRemaining: number;
}

// ─── Input ───────────────────────────────────────────────────────────────────

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  special: boolean;
}

// ─── Game State ──────────────────────────────────────────────────────────────

export type GamePhase =
  | 'waiting'
  | 'serving'
  | 'playing'
  | 'point_scored'
  | 'set_over'
  | 'match_over';

export interface Score {
  /** Points in current set */
  points: [number, number];
  /** Sets won */
  sets: [number, number];
}

export interface GameState {
  phase: GamePhase;
  missile: MissileState;
  players: [CharacterState, CharacterState];
  score: Score;
  /** Which player is serving next (0 or 1) */
  servingPlayer: 0 | 1;
  /** Accumulated frame time for deterministic physics */
  frameTime: number;
  /** Active visual effects */
  effects: EffectState[];
  /** Screen shake state */
  screenShake: ScreenShakeState;
  /** Flash overlay opacity 0–1 */
  flashOpacity: number;
  /** Toast message shown mid-game */
  toastMessage: string | null;
  toastExpiresAt: number;
  matchOver: boolean;
  winner: 0 | 1 | null;
}

// ─── Effects ─────────────────────────────────────────────────────────────────

export type EffectType = 'explosion' | 'trail' | 'spark' | 'shield_hit' | 'score_flash';

export interface EffectState {
  id: string;
  type: EffectType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  lifetime: number;
  maxLifetime: number;
}

export interface ScreenShakeState {
  intensity: number;
  duration: number;
  elapsed: number;
}

// ─── Game Mode ───────────────────────────────────────────────────────────────

export type GameMode = 'local_1v1' | 'online_1v1' | 'online_2v2' | 'vs_ai' | 'practice';
export type AIDifficulty = 'easy' | 'normal' | 'hard';

export interface GameConfig {
  mode: GameMode;
  player1CharacterId: string;
  player2CharacterId: string;
  aiDifficulty?: AIDifficulty;
  roomId?: string;
}

// ─── Game Events (shared client/server) ──────────────────────────────────────

export type GameEvent =
  | { type: 'score'; scoringPlayer: 0 | 1; newScore: Score }
  | { type: 'explosion'; x: number; y: number; radius: number }
  | { type: 'match_over'; winner: 0 | 1; eloChange: [number, number] }
  | { type: 'set_over'; winner: 0 | 1 }
  | { type: 'toast'; message: string };

// ─── Net / Arena ─────────────────────────────────────────────────────────────

export interface Net {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Arena {
  width: number;
  height: number;
  floorY: number;
  net: Net;
}
