/**
 * Pure physics functions — no side effects, no DOM, fully unit-testable.
 *
 * @module PhysicsEngine
 */

import type { MissileState, CharacterState, Arena } from '@/types/game';
import {
  CHAR_GRAVITY,
  CHAR_RADIUS,
  MISSILE_RADIUS,
  MAX_CHAR_SPEED,
  MAX_MISSILE_SPEED,
  BASE_HIT_SPEED,
  HIT_POWER_BONUS,
  MIN_HIT_VY,
} from '@/config/gameConfig';

// ─── Gravity & Drag ───────────────────────────────────────────────────────────

/** Apply gravity to a vertical velocity */
export function applyGravity(vy: number, gravity: number): number {
  return vy + gravity;
}

/** Apply drag coefficient symmetrically to both axes */
export function applyDrag(
  vx: number,
  vy: number,
  drag: number
): { vx: number; vy: number } {
  return { vx: vx * (1 - drag), vy: vy * (1 - drag) };
}

/** Clamp speed to maximum magnitude */
export function clampSpeed(v: number, max: number): number {
  return Math.max(-max, Math.min(max, v));
}

/** Step position by velocity */
export function stepPosition(
  pos: number,
  velocity: number
): number {
  return pos + velocity;
}

// ─── Collision Detection ──────────────────────────────────────────────────────

/** Circle–circle overlap test */
export function circlesOverlap(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const minDist = ar + br;
  return dx * dx + dy * dy < minDist * minDist;
}

/** AABB–circle overlap test (for net rectangle vs missile circle) */
export function circleAABBOverlap(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < cr * cr;
}

/** Check if missile has hit the floor */
export function missileHitFloor(missile: MissileState, floorY: number): boolean {
  return missile.y + MISSILE_RADIUS >= floorY;
}

/** Check if missile hit the net */
export function missileHitNet(missile: MissileState, arena: Arena): boolean {
  return circleAABBOverlap(
    missile.x, missile.y, MISSILE_RADIUS,
    arena.net.x, arena.net.y, arena.net.width, arena.net.height
  );
}

/** Check which half of the court the missile is in (0 = left player, 1 = right player) */
export function missileSide(missile: MissileState, arena: Arena): 0 | 1 {
  return missile.x < arena.width / 2 ? 0 : 1;
}

// ─── Character Physics ────────────────────────────────────────────────────────

/** Apply gravity and keep character on floor */
export function stepCharacter(
  char: CharacterState,
  arena: Arena
): CharacterState {
  const next = { ...char };

  // Horizontal movement
  next.x = Math.max(
    CHAR_RADIUS,
    Math.min(arena.width - CHAR_RADIUS, next.x + next.vx)
  );

  // Vertical movement + gravity
  next.vy = applyGravity(next.vy, CHAR_GRAVITY);
  next.y += next.vy;

  // Floor collision
  const floorY = arena.floorY - CHAR_RADIUS;
  if (next.y >= floorY) {
    next.y = floorY;
    next.vy = 0;
    next.isGrounded = true;
    next.isJumping = false;
  } else {
    next.isGrounded = false;
  }

  // Net boundary — players cannot cross the net
  const netCenterX = arena.net.x + arena.net.width / 2;
  const isLeftPlayer = char.x < netCenterX;
  if (isLeftPlayer && next.x > arena.net.x - CHAR_RADIUS) {
    next.x = arena.net.x - CHAR_RADIUS;
    next.vx = 0;
  } else if (!isLeftPlayer && next.x < arena.net.x + arena.net.width + CHAR_RADIUS) {
    next.x = arena.net.x + arena.net.width + CHAR_RADIUS;
    next.vx = 0;
  }

  // Speed cap
  next.vx = clampSpeed(next.vx, MAX_CHAR_SPEED);

  return next;
}

// ─── Missile Physics ──────────────────────────────────────────────────────────

/** Advance missile one physics frame */
export function stepMissile(missile: MissileState, arena: Arena): MissileState {
  if (!missile.active) return missile;

  const next = { ...missile };
  const cfg = next.config;

  // Apply drag
  const dragged = applyDrag(next.vx, next.vy, cfg.drag);
  next.vx = dragged.vx;
  next.vy = dragged.vy;

  // Apply gravity
  next.vy = applyGravity(next.vy, cfg.gravity);

  // Cap speed
  next.vx = clampSpeed(next.vx, MAX_MISSILE_SPEED);
  next.vy = clampSpeed(next.vy, MAX_MISSILE_SPEED);

  // Step position
  next.x = stepPosition(next.x, next.vx);
  next.y = stepPosition(next.y, next.vy);

  // Rotation follows velocity vector
  next.rotation = Math.atan2(next.vy, next.vx);

  // Wall bounces (left/right edges)
  if (next.x - MISSILE_RADIUS < 0) {
    next.x = MISSILE_RADIUS;
    next.vx = Math.abs(next.vx) * cfg.restitution;
  } else if (next.x + MISSILE_RADIUS > arena.width) {
    next.x = arena.width - MISSILE_RADIUS;
    next.vx = -Math.abs(next.vx) * cfg.restitution;
  }

  // Ceiling bounce (soft)
  if (next.y - MISSILE_RADIUS < 0) {
    next.y = MISSILE_RADIUS;
    next.vy = Math.abs(next.vy) * cfg.restitution;
  }

  return next;
}

// ─── Hit Response ─────────────────────────────────────────────────────────────

/**
 * Compute the missile velocity after a character hits it.
 * Direction is always away from the character (towards opponent's court).
 */
export function computeHitVelocity(
  missile: MissileState,
  char: CharacterState,
  playerSide: 0 | 1
): { vx: number; vy: number } {
  const hitSpeed = BASE_HIT_SPEED + (char.config.stats.power - 1) * HIT_POWER_BONUS;
  const speedMultiplier = missile.config.speedMultiplier;

  // Always send missile toward opponent's court
  const vx = (playerSide === 0 ? 1 : -1) * hitSpeed * speedMultiplier;

  // Vertical component: upward by default, angle biased by relative position
  const dy = missile.y - char.y;
  const rawVy = dy < 0 ? MIN_HIT_VY - 4 : MIN_HIT_VY;
  const vy = Math.min(rawVy, -2); // always somewhat upward

  return { vx: clampSpeed(vx, MAX_MISSILE_SPEED), vy };
}
