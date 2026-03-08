/**
 * API request / response types shared between route handlers and client fetchers.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TossAuthRequest {
  authorizationCode: string;
}

export interface TossAuthResponse {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  token: string;
}

export interface GuestAuthRequest {
  nickname: string;
}

export interface GuestAuthResponse {
  guestId: string;
  nickname: string;
}

// ─── Ranking ─────────────────────────────────────────────────────────────────

export type RankingPeriod = 'all' | 'weekly' | 'monthly';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl?: string;
  elo: number;
  tier: string;
  wins: number;
  losses: number;
  winRate: number;
  favoriteCharacterId: string;
}

export interface GetLeaderboardResponse {
  entries: LeaderboardEntry[];
  period: RankingPeriod;
  cachedAt: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface GameRecord {
  id: string;
  opponentNickname: string;
  opponentAvatarUrl?: string;
  result: 'win' | 'loss';
  eloChange: number;
  playedAt: string;
  characterId: string;
}

export interface GetProfileResponse {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  elo: number;
  tier: string;
  rank: number;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    maxStreak: number;
    currentStreak: number;
    favoriteCharacterId: string;
  };
  recentGames: GameRecord[];
  eloHistory: Array<{ date: string; elo: number }>;
}

// ─── Generic API Response Wrapper ────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  code: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
