/**
 * GET /api/profile/[userId]
 * Returns full profile stats, recent games, and ELO history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTier } from '@/lib/elo';
import type { ApiResponse, GetProfileResponse } from '@/types/api';

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse<ApiResponse<GetProfileResponse>>> {
  const { userId } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gameRecords: {
          orderBy: { playedAt: 'desc' },
          take: 20,
          include: { opponent: { select: { nickname: true, avatarUrl: true } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    const wins = user.gameRecords.filter((r) => r.result === 'win').length;
    const losses = user.gameRecords.filter((r) => r.result === 'loss').length;
    const totalGames = user.gameRecords.length;

    // Streak computation
    let currentStreak = 0;
    let maxStreak = 0;
    let streak = 0;
    for (const r of user.gameRecords) {
      if (r.result === 'win') {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 0;
      }
    }
    currentStreak = streak;

    // Favorite character
    const charFreq = user.gameRecords.reduce<Record<string, number>>((acc, r) => {
      acc[r.playerCharId] = (acc[r.playerCharId] ?? 0) + 1;
      return acc;
    }, {});
    const favoriteCharacterId = Object.entries(charFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'trump';

    // ELO history (last 30 records reversed = chronological)
    const eloHistory = [...user.gameRecords]
      .reverse()
      .map((r) => ({ date: r.playedAt.toISOString().split('T')[0], elo: r.eloAfter }));

    // Rank (users with higher ELO)
    const rank = (await prisma.user.count({ where: { elo: { gt: user.elo } } })) + 1;

    const recentGames = user.gameRecords.slice(0, 10).map((r) => ({
      id: r.id,
      opponentNickname: r.opponent.nickname,
      opponentAvatarUrl: r.opponent.avatarUrl ?? undefined,
      result: r.result as 'win' | 'loss',
      eloChange: r.eloChange,
      playedAt: r.playedAt.toISOString(),
      characterId: r.playerCharId,
    }));

    const profile: GetProfileResponse = {
      userId: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl ?? undefined,
      elo: user.elo,
      tier: getTier(user.elo).name,
      rank,
      stats: { totalGames, wins, losses, winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0, maxStreak, currentStreak, favoriteCharacterId },
      recentGames,
      eloHistory,
    };

    return NextResponse.json({ ok: true, data: profile });
  } catch (err) {
    console.error('[profile]', err);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Server error' }, { status: 500 });
  }
}
