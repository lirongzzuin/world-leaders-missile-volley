/**
 * ELO rating calculation — pure functions, unit-testable.
 *
 * @module elo
 */

import { ELO_K_FACTOR, ELO_INITIAL } from '@/config/gameConfig';

/** Expected score for player A vs player B (0–1) */
export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

/**
 * Calculate new ELO ratings after a match.
 * @param winnerElo Winner's current ELO
 * @param loserElo  Loser's current ELO
 * @returns New ELOs for winner and loser
 */
export function calculateNewElos(
  winnerElo: number,
  loserElo: number,
  kFactor = ELO_K_FACTOR
): { winnerNew: number; loserNew: number; winnerChange: number; loserChange: number } {
  const expectedWin = expectedScore(winnerElo, loserElo);
  const change = Math.round(kFactor * (1 - expectedWin));

  return {
    winnerNew: winnerElo + change,
    loserNew: Math.max(ELO_INITIAL - 100, loserElo - change), // floor at 900
    winnerChange: change,
    loserChange: -change,
  };
}

// ─── Tier mapping ─────────────────────────────────────────────────────────────

export interface Tier {
  name: string;
  minElo: number;
  color: string;
}

export const TIERS: Tier[] = [
  { name: '세계정상',   minElo: 2500, color: '#f9d406' },
  { name: 'Diamond',   minElo: 2000, color: '#06f9e9' },
  { name: 'Platinum',  minElo: 1700, color: '#a78bfa' },
  { name: 'Gold',      minElo: 1400, color: '#fbbf24' },
  { name: 'Silver',    minElo: 1200, color: '#9ca3af' },
  { name: 'Bronze',    minElo: 0,    color: '#92400e' },
];

export function getTier(elo: number): Tier {
  for (const tier of TIERS) {
    if (elo >= tier.minElo) return tier;
  }
  return TIERS[TIERS.length - 1];
}
