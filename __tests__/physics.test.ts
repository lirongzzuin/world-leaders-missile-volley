import {
  applyGravity,
  applyDrag,
  clampSpeed,
  circlesOverlap,
  circleAABBOverlap,
  missileHitFloor,
  missileSide,
} from '@/game/PhysicsEngine';
import type { MissileState } from '@/types/game';
import { MISSILE_MAP } from '@/config/missileTypes';
import { ARENA } from '@/config/gameConfig';

const defaultMissile = (): MissileState => ({
  x: 200,
  y: 200,
  vx: 5,
  vy: -8,
  rotation: 0,
  config: MISSILE_MAP['standard'],
  lastTouchedBy: null,
  active: true,
});

describe('applyGravity', () => {
  it('increases vy by gravity each frame', () => {
    expect(applyGravity(0, 0.32)).toBeCloseTo(0.32);
    expect(applyGravity(5, 0.32)).toBeCloseTo(5.32);
  });

  it('works with negative vy (upward)', () => {
    expect(applyGravity(-10, 0.32)).toBeCloseTo(-9.68);
  });
});

describe('applyDrag', () => {
  it('reduces speed toward zero', () => {
    const result = applyDrag(10, 10, 0.01);
    expect(result.vx).toBeLessThan(10);
    expect(result.vy).toBeLessThan(10);
  });

  it('drag 0 means no change', () => {
    const result = applyDrag(5, -3, 0);
    expect(result.vx).toBeCloseTo(5);
    expect(result.vy).toBeCloseTo(-3);
  });
});

describe('clampSpeed', () => {
  it('clamps positive values', () => {
    expect(clampSpeed(100, 28)).toBe(28);
  });

  it('clamps negative values', () => {
    expect(clampSpeed(-100, 28)).toBe(-28);
  });

  it('leaves value in range unchanged', () => {
    expect(clampSpeed(10, 28)).toBe(10);
  });
});

describe('circlesOverlap', () => {
  it('detects overlapping circles', () => {
    expect(circlesOverlap(0, 0, 10, 5, 0, 10)).toBe(true);
  });

  it('returns false for non-overlapping circles', () => {
    expect(circlesOverlap(0, 0, 10, 25, 0, 10)).toBe(false);
  });

  it('boundary: touching circles do not overlap (strict less-than)', () => {
    expect(circlesOverlap(0, 0, 10, 20, 0, 10)).toBe(false);
  });
});

describe('circleAABBOverlap', () => {
  it('detects circle inside AABB', () => {
    expect(circleAABBOverlap(5, 5, 3, 0, 0, 20, 20)).toBe(true);
  });

  it('detects circle touching AABB edge', () => {
    expect(circleAABBOverlap(23, 10, 5, 0, 0, 20, 20)).toBe(true);
  });

  it('returns false when circle is far from AABB', () => {
    expect(circleAABBOverlap(100, 100, 5, 0, 0, 20, 20)).toBe(false);
  });
});

describe('missileHitFloor', () => {
  it('detects when missile bottom touches floor', () => {
    const m = defaultMissile();
    // MISSILE_RADIUS = 14; bottom = y + 14. floorY = 400.
    // y = 380 → bottom = 394 < 400 → no hit
    m.y = ARENA.floorY - 20;
    expect(missileHitFloor(m, ARENA.floorY)).toBe(false);
    // y = 400 → bottom = 414 >= 400 → hit
    m.y = ARENA.floorY;
    expect(missileHitFloor(m, ARENA.floorY)).toBe(true);
  });
});

describe('missileSide', () => {
  it('returns 0 for left half', () => {
    const m = defaultMissile();
    m.x = 100;
    expect(missileSide(m, ARENA)).toBe(0);
  });

  it('returns 1 for right half', () => {
    const m = defaultMissile();
    m.x = 600;
    expect(missileSide(m, ARENA)).toBe(1);
  });
});
