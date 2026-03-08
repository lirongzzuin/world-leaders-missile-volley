/**
 * Pure input-processing function shared between the client and the socket server.
 * Extracted from GameCanvas so the server-side game loop can reuse it without DOM.
 *
 * @module InputProcessor
 */

import type { GameState, CharacterState, PlayerInput } from '@/types/game';

export function applyInput(
  state: GameState,
  playerIdx: 0 | 1,
  input: PlayerInput
): GameState {
  const next: GameState = {
    ...state,
    players: [{ ...state.players[0] }, { ...state.players[1] }],
  };
  const char: CharacterState = { ...next.players[playerIdx] };
  const cfg = char.config;
  const speedMult = cfg.stats.speed / 3;
  const jumpMult = cfg.stats.jump / 3;

  if (input.left) {
    char.vx = Math.max(-8, char.vx - 1.5 * speedMult);
    char.facingLeft = true;
  } else if (input.right) {
    char.vx = Math.min(8, char.vx + 1.5 * speedMult);
    char.facingLeft = false;
  } else {
    char.vx *= 0.78; // friction
  }

  if (input.jump && char.isGrounded) {
    char.vy = -13 * jumpMult;
    char.isGrounded = false;
    char.isJumping = true;
  }

  if (
    input.special &&
    char.specialCooldownRemaining <= 0 &&
    (state.phase === 'playing' || state.phase === 'serving')
  ) {
    char.specialCooldownRemaining = cfg.special.cooldown;
    next.players[playerIdx] = char;
    return cfg.special.execute({ ...next });
  }

  next.players[playerIdx] = char;
  return next;
}
