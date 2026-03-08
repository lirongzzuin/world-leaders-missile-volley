/**
 * Missile type registry.
 * To add a new missile: append a MissileConfig object to MISSILE_TYPES.
 *
 * @module missileTypes
 */

import type { MissileConfig } from '@/types/game';

/** Standard ballistic missile — balanced physics */
const standard: MissileConfig = {
  id: 'standard',
  name: 'ICBM',
  gravity: 0.32,
  drag: 0.005,
  restitution: 0.45,
  trailColor: ['#ff6a00', '#f9d406'],
  explosionRadius: 60,
  hitShakeIntensity: 6,
  speedMultiplier: 1.0,
};

/** Hypersonic missile — flat trajectory, very fast, low gravity */
const hypersonic: MissileConfig = {
  id: 'hypersonic',
  name: '극초음속',
  gravity: 0.14,
  drag: 0.002,
  restitution: 0.25,
  trailColor: ['#06f9e9', '#4f46e5'],
  explosionRadius: 45,
  hitShakeIntensity: 4,
  speedMultiplier: 1.6,
};

/** Cruise missile — slow, low arc, unpredictable bounce */
const cruise: MissileConfig = {
  id: 'cruise',
  name: '순항미사일',
  gravity: 0.1,
  drag: 0.008,
  restitution: 0.7,
  trailColor: ['#22c55e', '#86efac'],
  explosionRadius: 50,
  hitShakeIntensity: 5,
  speedMultiplier: 0.85,
};

/** ICBM (max arc) — massive parabola, enormous explosion */
const icbm: MissileConfig = {
  id: 'icbm',
  name: 'ICBM MAX',
  gravity: 0.42,
  drag: 0.004,
  restitution: 0.15,
  trailColor: ['#ef4444', '#991b1b'],
  explosionRadius: 100,
  hitShakeIntensity: 12,
  speedMultiplier: 1.1,
};

export const MISSILE_TYPES: MissileConfig[] = [standard, hypersonic, cruise, icbm];

/** O(1) lookup by id */
export const MISSILE_MAP = Object.fromEntries(
  MISSILE_TYPES.map((m) => [m.id, m])
) as Record<string, MissileConfig>;

export const DEFAULT_MISSILE_ID = 'standard';
