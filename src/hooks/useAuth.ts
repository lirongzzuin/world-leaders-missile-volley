/**
 * Authentication hook.
 * Handles Toss appLogin flow, Kakao, Google, and Guest modes.
 * Stores user info in localStorage for persistence between page navigations.
 *
 * @module useAuth
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { appLogin, isTossApp } from '@/lib/apps-in-toss';
import logger from '@/lib/logger';

export interface AuthUser {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  provider: 'toss' | 'kakao' | 'google' | 'guest';
  elo: number;
}

const STORAGE_KEY = 'wlmv_user';

function loadStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadStoredUser();
    if (stored) setUser(stored);
    setInitialized(true);
  }, []);

  /** Login with Toss Apps-in-Toss flow */
  const loginWithToss = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { authorizationCode } = await appLogin();
      const res = await fetch('/api/toss-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode }),
      });

      if (!res.ok) throw new Error('Toss auth exchange failed');
      const data = await res.json() as { userId: string; nickname: string; avatarUrl?: string };

      // Upsert user in DB to get server-side ELO
      const upsertRes = await fetch('/api/user/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'toss', providerId: data.userId, nickname: data.nickname, avatarUrl: data.avatarUrl }),
      });
      const upsertData = upsertRes.ok ? (await upsertRes.json() as { ok: boolean; data?: { userId: string; elo: number } }) : null;

      const authUser: AuthUser = {
        userId: upsertData?.data?.userId ?? data.userId,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
        provider: 'toss',
        elo: upsertData?.data?.elo ?? 1000,
      };
      saveUser(authUser);
      setUser(authUser);
      logger.info('Toss login success', { userId: authUser.userId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      logger.error('Toss login error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Login as guest with a callsign */
  const loginAsGuest = useCallback(async (nickname: string) => {
    if (!nickname.trim()) {
      setError('Callsign is required');
      return;
    }
    const guestId = `guest_${Date.now()}`;
    const authUser: AuthUser = {
      userId: guestId,
      nickname: nickname.trim().toUpperCase(),
      provider: 'guest',
      elo: 1000,
    };
    saveUser(authUser);
    setUser(authUser);
    logger.info('Guest login', { guestId });
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return { user, initialized, loading, error, loginWithToss, loginAsGuest, logout, isTossApp: isTossApp() };
}
