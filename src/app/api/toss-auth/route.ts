/**
 * POST /api/toss-auth
 * Exchange Toss authorizationCode for user info.
 * In production this calls the Toss OpenID / user-info endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import type { TossAuthRequest, TossAuthResponse, ApiResponse } from '@/types/api';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<TossAuthResponse>>> {
  try {
    const body = (await req.json()) as TossAuthRequest;
    const { authorizationCode } = body;

    if (!authorizationCode) {
      return NextResponse.json({ ok: false, code: 'MISSING_CODE', message: 'authorizationCode is required' }, { status: 400 });
    }

    // ── Development / mock mode ──────────────────────────────────────────────
    if (authorizationCode.startsWith('mock_auth_code_')) {
      const mockUser: TossAuthResponse = {
        userId: `toss_${authorizationCode.slice(-8)}`,
        nickname: 'TOSS_COMMANDER',
        token: 'mock_session_token',
      };
      logger.info('Toss auth mock exchange', { userId: mockUser.userId });
      return NextResponse.json({ ok: true, data: mockUser });
    }

    // ── Production: exchange code with Toss token endpoint ───────────────────
    const clientId = process.env.TOSS_CLIENT_ID;
    const clientSecret = process.env.TOSS_CLIENT_SECRET;
    const redirectUri = process.env.TOSS_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      logger.error('Missing Toss OAuth credentials');
      return NextResponse.json({ ok: false, code: 'CONFIG_ERROR', message: 'Server misconfiguration' }, { status: 500 });
    }

    // Step 1: Exchange code for access token
    const tokenRes = await fetch('https://accounts.toss.im/v1/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        redirect_uri: redirectUri ?? '',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      logger.error('Toss token exchange failed', err);
      return NextResponse.json({ ok: false, code: 'TOKEN_EXCHANGE_FAILED', message: 'Token exchange failed' }, { status: 401 });
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    // Step 2: Get user info
    const userRes = await fetch('https://accounts.toss.im/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.json({ ok: false, code: 'USERINFO_FAILED', message: 'Could not fetch user info' }, { status: 401 });
    }

    const userData = (await userRes.json()) as { sub: string; nickname?: string; picture?: string };
    const response: TossAuthResponse = {
      userId: `toss_${userData.sub}`,
      nickname: userData.nickname ?? `COMMANDER_${userData.sub.slice(-4)}`,
      avatarUrl: userData.picture,
      token: tokenData.access_token,
    };

    logger.info('Toss auth success', { userId: response.userId });
    return NextResponse.json({ ok: true, data: response });

  } catch (err) {
    logger.error('Toss auth error', err);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}
