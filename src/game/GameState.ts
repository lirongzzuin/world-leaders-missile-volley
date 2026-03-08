/**
 * Game state factory and reducer.
 * All state transitions are pure functions — no mutations.
 *
 * @module GameState
 */

import type {
  GameState,
  MissileState,
  CharacterState,
  Score,
  GameConfig,
} from '@/types/game';
import { CHARACTER_MAP } from '@/config/characters';
import { MISSILE_MAP, DEFAULT_MISSILE_ID } from '@/config/missileTypes';
import {
  CANVAS_WIDTH,
  FLOOR_Y,
  ARENA,
  CHAR_RADIUS,
  POINTS_PER_SET,
  SETS_TO_WIN,
  SERVE_HEIGHT_ABOVE_CHAR,
} from '@/config/gameConfig';

// ─── Initial State ────────────────────────────────────────────────────────────

function initialCharState(id: string, x: number): CharacterState {
  const config = CHARACTER_MAP[id] ?? CHARACTER_MAP['trump'];
  return {
    id,
    config,
    x,
    y: FLOOR_Y - CHAR_RADIUS,
    vx: 0,
    vy: 0,
    facingLeft: x > CANVAS_WIDTH / 2,
    isGrounded: true,
    isJumping: false,
    specialCooldownRemaining: 0,
    isSpecialActive: false,
    shieldActive: false,
    shieldExpiresAt: 0,
    hitFlashRemaining: 0,
  };
}

function initialMissileState(servingPlayer: 0 | 1, playerX: number): MissileState {
  const config = MISSILE_MAP[DEFAULT_MISSILE_ID];
  const x = servingPlayer === 0 ? playerX : playerX;
  return {
    x,
    y: FLOOR_Y - CHAR_RADIUS - SERVE_HEIGHT_ABOVE_CHAR,
    vx: 0,
    vy: -2,
    rotation: -Math.PI / 4,
    config,
    lastTouchedBy: null,
    active: true,
  };
}

export function createInitialGameState(cfg: GameConfig): GameState {
  const p1 = initialCharState(cfg.player1CharacterId, CANVAS_WIDTH * 0.25);
  const p2 = initialCharState(cfg.player2CharacterId, CANVAS_WIDTH * 0.75);

  return {
    phase: 'serving',
    missile: initialMissileState(0, p1.x),
    players: [p1, p2],
    score: { points: [0, 0], sets: [0, 0] },
    servingPlayer: 0,
    frameTime: 0,
    effects: [],
    screenShake: { intensity: 0, duration: 0, elapsed: 0 },
    flashOpacity: 0,
    toastMessage: null,
    toastExpiresAt: 0,
    matchOver: false,
    winner: null,
  };
}

// ─── Scoring Logic ────────────────────────────────────────────────────────────

/**
 * Award a point to the given player.
 * Handles set/match completion.
 */
export function awardPoint(state: GameState, scoringPlayer: 0 | 1): GameState {
  const score: Score = {
    points: [...state.score.points] as [number, number],
    sets: [...state.score.sets] as [number, number],
  };

  score.points[scoringPlayer] += 1;

  let phase = state.phase;
  let matchOver = false;
  let winner: 0 | 1 | null = null;

  if (score.points[scoringPlayer] >= POINTS_PER_SET) {
    score.sets[scoringPlayer] += 1;
    score.points = [0, 0];
    phase = 'set_over';

    if (score.sets[scoringPlayer] >= SETS_TO_WIN) {
      matchOver = true;
      winner = scoringPlayer;
      phase = 'match_over';
    }
  } else {
    phase = 'point_scored';
  }

  return { ...state, score, phase, matchOver, winner };
}

/** Reset missile for next serve */
export function resetForServe(state: GameState, servingPlayer: 0 | 1): GameState {
  const server = state.players[servingPlayer];
  const missile = initialMissileState(servingPlayer, server.x);
  return {
    ...state,
    missile,
    servingPlayer,
    phase: 'serving',
    flashOpacity: 0,
  };
}

// ─── Special Cooldown ─────────────────────────────────────────────────────────

export function tickCooldowns(state: GameState): GameState {
  const players = state.players.map((p) => ({
    ...p,
    specialCooldownRemaining: Math.max(0, p.specialCooldownRemaining - 1 / 60),
    hitFlashRemaining: Math.max(0, p.hitFlashRemaining - 1),
    shieldActive: p.shieldActive && Date.now() < p.shieldExpiresAt,
  })) as [CharacterState, CharacterState];

  return { ...state, players };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function tickToast(state: GameState): GameState {
  if (state.toastMessage && Date.now() > state.toastExpiresAt) {
    return { ...state, toastMessage: null };
  }
  return state;
}

/** Tick flash opacity toward 0 */
export function tickFlash(state: GameState): GameState {
  if (state.flashOpacity <= 0) return state;
  return { ...state, flashOpacity: Math.max(0, state.flashOpacity - 0.05) };
}
