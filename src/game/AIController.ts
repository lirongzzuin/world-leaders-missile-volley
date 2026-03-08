/**
 * AI controller — computes PlayerInput for the AI-controlled character.
 * All difficulty parameters come from gameConfig.AI_CONFIG (no hardcoding).
 *
 * @module AIController
 */

import type { GameState, PlayerInput, AIDifficulty } from '@/types/game';
import { AI_CONFIG, CANVAS_WIDTH, FLOOR_Y, CHAR_RADIUS } from '@/config/gameConfig';

/** Predict where the missile will be at x = targetX using simple ballistic math */
export function predictMissileY(
  mx: number,
  my: number,
  mvx: number,
  mvy: number,
  gravity: number,
  targetX: number
): number {
  if (Math.abs(mvx) < 0.01) return my;
  const t = (targetX - mx) / mvx;
  if (t < 0) return my; // missile moving away
  // y = my + mvy*t + 0.5*g*t²
  return my + mvy * t + 0.5 * gravity * t * t;
}

interface AIFrame {
  frameCount: number;
}

const frameCounters = new WeakMap<object, AIFrame>();

/**
 * Compute AI input for one frame.
 * @param state Current game state
 * @param playerIndex Which player is the AI (0 or 1)
 * @param difficulty AI difficulty level
 * @param key Stable object reference for per-AI state (pass the same object each frame)
 */
export function computeAIInput(
  state: GameState,
  playerIndex: 0 | 1,
  difficulty: AIDifficulty,
  key: object
): PlayerInput {
  const cfg = AI_CONFIG[difficulty];

  if (!frameCounters.has(key)) frameCounters.set(key, { frameCount: 0 });
  const frame = frameCounters.get(key)!;
  frame.frameCount++;

  const input: PlayerInput = { left: false, right: false, jump: false, special: false };

  if (state.phase !== 'playing' && state.phase !== 'serving') return input;

  const missile = state.missile;
  const ai = state.players[playerIndex];
  const floorY = FLOOR_Y - CHAR_RADIUS;

  // Reaction delay — AI doesn't react immediately every frame
  if (frame.frameCount % Math.max(1, cfg.reactionDelayFrames) !== 0) return input;

  // Intentional miss (easy mode)
  if (Math.random() < cfg.missThreshold) return input;

  const isLeftPlayer = playerIndex === 0;
  const mySideStart = isLeftPlayer ? 0 : CANVAS_WIDTH / 2;
  const mySideEnd = isLeftPlayer ? CANVAS_WIDTH / 2 : CANVAS_WIDTH;

  // Predict where missile will be at AI's x position
  const predictedY = predictMissileY(
    missile.x,
    missile.y,
    missile.vx,
    missile.vy,
    missile.config.gravity,
    ai.x
  );

  // Is missile heading toward AI's side?
  const missileComingToMe =
    isLeftPlayer ? missile.vx < 0 : missile.vx > 0;

  const missileOnMySide = missile.x >= mySideStart && missile.x < mySideEnd;

  if (missileComingToMe || missileOnMySide) {
    // Move toward predicted X of missile
    const targetX = Math.max(mySideStart + 40, Math.min(mySideEnd - 40, missile.x));
    const dx = targetX - ai.x;
    const speed = Math.abs(dx) * cfg.speedMultiplier;

    if (Math.abs(dx) > 10) {
      input.left = dx < 0;
      input.right = dx > 0;
    }

    // Jump if missile is above AI and within reach
    if (
      ai.isGrounded &&
      predictedY < ai.y - 40 &&
      Math.abs(missile.x - ai.x) < 120
    ) {
      input.jump = true;
    }

    // Special move when close to missile
    if (
      ai.specialCooldownRemaining <= 0 &&
      Math.abs(missile.x - ai.x) < 100 &&
      Math.random() < cfg.useSpecialThreshold
    ) {
      input.special = true;
    }
  } else {
    // Return to defensive position when missile is on opponent's side
    const defendX = isLeftPlayer ? CANVAS_WIDTH * 0.25 : CANVAS_WIDTH * 0.75;
    const dx = defendX - ai.x;
    if (Math.abs(dx) > 20) {
      input.left = dx < 0;
      input.right = dx > 0;
    }
  }

  return input;
}
