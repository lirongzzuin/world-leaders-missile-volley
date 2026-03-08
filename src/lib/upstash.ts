/**
 * Lazy Upstash Redis client with TTL defaults.
 * Usage: const redis = getRedis(); await redis.set('key', 'val', { ex: 300 });
 *
 * @module upstash
 */

import { Redis } from '@upstash/redis';
import logger from './logger';
import { RANKING_CACHE_TTL_SEC, MATCHMAKING_TTL_SEC, SESSION_TTL_SEC } from '@/config/gameConfig';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing Upstash env vars: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.'
    );
  }

  _redis = new Redis({ url, token });
  logger.info('Upstash Redis client initialized');
  return _redis;
}

// ─── Typed helpers with baked-in TTLs ────────────────────────────────────────

const RANKING_KEY = 'ranking:leaderboard';
const SESSION_PREFIX = 'session:';
const QUEUE_PREFIX = 'queue:';

export async function getCachedRanking(period: string): Promise<string | null> {
  return getRedis().get<string>(`${RANKING_KEY}:${period}`);
}

export async function setCachedRanking(period: string, data: string): Promise<void> {
  await getRedis().set(`${RANKING_KEY}:${period}`, data, { ex: RANKING_CACHE_TTL_SEC });
}

export async function getSession(sessionId: string): Promise<string | null> {
  return getRedis().get<string>(`${SESSION_PREFIX}${sessionId}`);
}

export async function setSession(sessionId: string, data: string): Promise<void> {
  await getRedis().set(`${SESSION_PREFIX}${sessionId}`, data, { ex: SESSION_TTL_SEC });
}

export async function addToMatchmakingQueue(
  userId: string,
  elo: number,
  characterId: string
): Promise<void> {
  const key = `${QUEUE_PREFIX}${userId}`;
  await getRedis().set(key, JSON.stringify({ userId, elo, characterId, joinedAt: Date.now() }), {
    ex: MATCHMAKING_TTL_SEC,
  });
}

export async function removeFromQueue(userId: string): Promise<void> {
  await getRedis().del(`${QUEUE_PREFIX}${userId}`);
}
