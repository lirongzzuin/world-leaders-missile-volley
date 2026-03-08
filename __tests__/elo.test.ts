import { expectedScore, calculateNewElos, getTier } from '@/lib/elo';
import { ELO_INITIAL } from '@/config/gameConfig';

describe('ELO — expectedScore', () => {
  it('returns 0.5 when both players have equal ELO', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5);
  });

  it('returns > 0.5 when player A has higher ELO', () => {
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
  });

  it('returns < 0.5 when player A has lower ELO', () => {
    expect(expectedScore(800, 1000)).toBeLessThan(0.5);
  });

  it('returns a value in [0, 1]', () => {
    const e = expectedScore(2000, 800);
    expect(e).toBeGreaterThanOrEqual(0);
    expect(e).toBeLessThanOrEqual(1);
  });
});

describe('ELO — calculateNewElos', () => {
  it('awards more points when underdog wins', () => {
    const { winnerChange } = calculateNewElos(800, 1600);
    expect(winnerChange).toBeGreaterThan(20);
  });

  it('awards fewer points when strong player beats weak player', () => {
    const { winnerChange } = calculateNewElos(1600, 800);
    expect(winnerChange).toBeLessThan(15);
  });

  it('loser ELO decreases by same amount as winner gains', () => {
    const { winnerChange, loserChange } = calculateNewElos(1000, 1000);
    expect(winnerChange).toBe(-loserChange);
  });

  it('loser ELO never drops below floor', () => {
    const { loserNew } = calculateNewElos(1000, ELO_INITIAL, 32);
    expect(loserNew).toBeGreaterThanOrEqual(900);
  });
});

describe('ELO — getTier', () => {
  it('returns Bronze for initial ELO', () => {
    expect(getTier(ELO_INITIAL).name).toBe('Bronze');
  });

  it('returns 세계정상 for very high ELO', () => {
    expect(getTier(2999).name).toBe('세계정상');
  });

  it('returns correct tier at each boundary', () => {
    expect(getTier(1200).name).toBe('Silver');
    expect(getTier(1400).name).toBe('Gold');
    expect(getTier(1700).name).toBe('Platinum');
    expect(getTier(2000).name).toBe('Diamond');
  });
});
