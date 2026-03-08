/**
 * POST /api/user/upsert
 * Creates or updates a user record on login.
 * Called from useAuth after successful auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/api';
import { ELO_INITIAL } from '@/config/gameConfig';

interface UpsertUserRequest {
  provider: string;
  providerId: string;
  nickname: string;
  avatarUrl?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ userId: string; elo: number }>>> {
  try {
    const body = (await req.json()) as UpsertUserRequest;

    if (!body.provider || !body.providerId || !body.nickname) {
      return NextResponse.json({ ok: false, code: 'INVALID_PAYLOAD', message: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { provider_providerId: { provider: body.provider, providerId: body.providerId } },
      update: {
        nickname: body.nickname,
        avatarUrl: body.avatarUrl ?? null,
      },
      create: {
        provider: body.provider,
        providerId: body.providerId,
        nickname: body.nickname,
        avatarUrl: body.avatarUrl ?? null,
        elo: ELO_INITIAL,
      },
      select: { id: true, elo: true },
    });

    return NextResponse.json({ ok: true, data: { userId: user.id, elo: user.elo } });
  } catch (err) {
    console.error('[user/upsert]', err);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Server error' }, { status: 500 });
  }
}
