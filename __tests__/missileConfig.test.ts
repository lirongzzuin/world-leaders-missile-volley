import { MISSILE_TYPES, MISSILE_MAP, DEFAULT_MISSILE_ID } from '@/config/missileTypes';

describe('missileTypes — structure', () => {
  it('all missiles have required fields', () => {
    for (const m of MISSILE_TYPES) {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(typeof m.gravity).toBe('number');
      expect(typeof m.drag).toBe('number');
      expect(typeof m.restitution).toBe('number');
      expect(Array.isArray(m.trailColor)).toBe(true);
      expect(m.trailColor).toHaveLength(2);
      expect(typeof m.explosionRadius).toBe('number');
      expect(typeof m.hitShakeIntensity).toBe('number');
      expect(typeof m.speedMultiplier).toBe('number');
    }
  });

  it('ids are unique', () => {
    const ids = MISSILE_TYPES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('MISSILE_MAP contains all missiles', () => {
    for (const m of MISSILE_TYPES) {
      expect(MISSILE_MAP[m.id]).toBe(m);
    }
  });

  it('default missile exists', () => {
    expect(MISSILE_MAP[DEFAULT_MISSILE_ID]).toBeDefined();
  });
});

describe('missileTypes — balance', () => {
  it('all gravity values are positive', () => {
    MISSILE_TYPES.forEach((m) => expect(m.gravity).toBeGreaterThan(0));
  });

  it('drag values are in valid range [0, 0.05]', () => {
    MISSILE_TYPES.forEach((m) => {
      expect(m.drag).toBeGreaterThanOrEqual(0);
      expect(m.drag).toBeLessThanOrEqual(0.05);
    });
  });

  it('restitution values are in [0, 1]', () => {
    MISSILE_TYPES.forEach((m) => {
      expect(m.restitution).toBeGreaterThanOrEqual(0);
      expect(m.restitution).toBeLessThanOrEqual(1);
    });
  });

  it('hypersonic has lower gravity than standard (flat trajectory)', () => {
    expect(MISSILE_MAP['hypersonic'].gravity).toBeLessThan(MISSILE_MAP['standard'].gravity);
  });

  it('cruise has lowest gravity (near horizontal flight)', () => {
    expect(MISSILE_MAP['cruise'].gravity).toBeLessThan(MISSILE_MAP['standard'].gravity);
  });

  it('icbm has highest explosion radius', () => {
    const maxRadius = Math.max(...MISSILE_TYPES.map((m) => m.explosionRadius));
    expect(MISSILE_MAP['icbm'].explosionRadius).toBe(maxRadius);
  });
});
