/**
 * POST /api/game/complete
 * Persists match result and updates ELO for both players.
 * Called by the Fly.io socket server (server-to-server).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/api';

interface PlayerResult {
  userId: string;
  characterId: string;
  eloChange: number;
}

interface GameCompleteRequest {
  roomId: string;
  winner: 0 | 1;
  player0: PlayerResult;
  player1: PlayerResult;
}

const SERVER_SECRET = process.env.SERVER_SECRET ?? '';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ ok: true }>>> {
  // Verify server-to-server secret
  const secret = req.headers.get('x-server-secret');
  if (SERVER_SECRET && secret !== SERVER_SECRET) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED', message: 'Invalid server secret' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as GameCompleteRequest;
    const { player0, player1, winner } = body;

    const [p0User, p1User] = await Promise.all([
      prisma.user.findUnique({ where: { id: player0.userId }, select: { id: true, elo: true } }),
      prisma.user.findUnique({ where: { id: player1.userId }, select: { id: true, elo: true } }),
    ]);

    if (!p0User || !p1User) {
      return NextResponse.json({ ok: false, code: 'USER_NOT_FOUND', message: 'Player not found' }, { status: 404 });
    }

    const newElo0 = Math.max(0, p0User.elo + player0.eloChange);
    const newElo1 = Math.max(0, p1User.elo + player1.eloChange);

    await prisma.$transaction([
      // Update ELOs
      prisma.user.update({ where: { id: player0.userId }, data: { elo: newElo0 } }),
      prisma.user.update({ where: { id: player1.userId }, data: { elo: newElo1 } }),
      // Create game records
      prisma.gameRecord.create({
        data: {
          playerId: player0.userId,
          opponentId: player1.userId,
          playerCharId: player0.characterId,
          opponentCharId: player1.characterId,
          result: winner === 0 ? 'win' : 'loss',
          eloChange: player0.eloChange,
          eloAfter: newElo0,
          mode: 'online_1v1',
        },
      }),
      prisma.gameRecord.create({
        data: {
          playerId: player1.userId,
          opponentId: player0.userId,
          playerCharId: player1.characterId,
          opponentCharId: player0.characterId,
          result: winner === 1 ? 'win' : 'loss',
          eloChange: player1.eloChange,
          eloAfter: newElo1,
          mode: 'online_1v1',
        },
      }),
    ]);

    return NextResponse.json({ ok: true, data: { ok: true } });
  } catch (err) {
    console.error('[game/complete]', err);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Server error' }, { status: 500 });
  }
}
