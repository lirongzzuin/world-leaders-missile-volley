/**
 * GET /api/ranking?period=all|weekly|monthly&limit=50
 * Returns leaderboard with 5-minute Redis cache.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedis } from '@/lib/upstash';
import { getTier } from '@/lib/elo';
import type { ApiResponse, GetLeaderboardResponse, LeaderboardEntry, RankingPeriod } from '@/types/api';
import { RANKING_CACHE_TTL_SEC } from '@/config/gameConfig';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<GetLeaderboardResponse>>> {
  const period = (req.nextUrl.searchParams.get('period') ?? 'all') as RankingPeriod;
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10));
  const cacheKey = `ranking:${period}:${limit}`;

  try {
    const redis = getRedis();

    // Check cache
    const cached = await redis.get<GetLeaderboardResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, data: cached });
    }

    // Date filter for weekly/monthly
    let since: Date | null = null;
    if (period === 'weekly') {
      since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // For period-filtered ranking, aggregate wins/losses from GameRecord
    // For 'all', use user.elo directly
    let entries: LeaderboardEntry[];

    if (period === 'all') {
      const users = await prisma.user.findMany({
        orderBy: { elo: 'desc' },
        take: limit,
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
          elo: true,
          gameRecords: {
            select: { result: true, playerCharId: true },
          },
        },
      });

      entries = users.map((u, i) => {
        const wins = u.gameRecords.filter((r) => r.result === 'win').length;
        const losses = u.gameRecords.filter((r) => r.result === 'loss').length;
        const charFreq = u.gameRecords.reduce<Record<string, number>>((acc, r) => {
          acc[r.playerCharId] = (acc[r.playerCharId] ?? 0) + 1;
          return acc;
        }, {});
        const favoriteCharacterId = Object.entries(charFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'trump';
        return {
          rank: i + 1,
          userId: u.id,
          nickname: u.nickname,
          avatarUrl: u.avatarUrl ?? undefined,
          elo: u.elo,
          tier: getTier(u.elo).name,
          wins,
          losses,
          winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
          favoriteCharacterId,
        };
      });
    } else {
      // Period-based: rank by wins in the period
      const records = await prisma.gameRecord.groupBy({
        by: ['playerId'],
        where: { playedAt: { gte: since! } },
        _count: { result: true },
        orderBy: { _count: { result: 'desc' } },
        take: limit,
      });

      const userIds = records.map((r) => r.playerId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, nickname: true, avatarUrl: true, elo: true },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      entries = await Promise.all(
        records.map(async (r, i) => {
          const u = userMap[r.playerId];
          const periodRecords = await prisma.gameRecord.findMany({
            where: { playerId: r.playerId, playedAt: { gte: since! } },
            select: { result: true, playerCharId: true },
          });
          const wins = periodRecords.filter((gr) => gr.result === 'win').length;
          const losses = periodRecords.filter((gr) => gr.result === 'loss').length;
          const charFreq = periodRecords.reduce<Record<string, number>>((acc, gr) => {
            acc[gr.playerCharId] = (acc[gr.playerCharId] ?? 0) + 1;
            return acc;
          }, {});
          const favoriteCharacterId = Object.entries(charFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'trump';
          return {
            rank: i + 1,
            userId: r.playerId,
            nickname: u?.nickname ?? 'Unknown',
            avatarUrl: u?.avatarUrl ?? undefined,
            elo: u?.elo ?? 1000,
            tier: getTier(u?.elo ?? 1000).name,
            wins,
            losses,
            winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
            favoriteCharacterId,
          };
        })
      );
    }

    const response: GetLeaderboardResponse = {
      entries,
      period,
      cachedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await redis.set(cacheKey, response, { ex: RANKING_CACHE_TTL_SEC });

    return NextResponse.json({ ok: true, data: response });
  } catch (err) {
    console.error('[ranking]', err);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Server error' }, { status: 500 });
  }
}
