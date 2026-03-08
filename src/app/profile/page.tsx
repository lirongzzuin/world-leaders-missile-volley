'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getTier } from '@/lib/elo';
import { CHARACTER_MAP } from '@/config/characters';
import BottomNav from '@/components/ui/BottomNav';
import type { GetProfileResponse } from '@/types/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const tier = user ? getTier(user.elo) : null;

  const [profile, setProfile] = useState<GetProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile/${user.userId}`)
      .then((r) => r.json())
      .then((res: { ok: boolean; data?: GetProfileResponse }) => {
        if (res.ok && res.data) setProfile(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user]);

  const stats = profile?.stats;
  const eloHistory = profile?.eloHistory ?? [];
  const maxElo = Math.max(...eloHistory.map((h) => h.elo), user?.elo ?? 1000);
  const minElo = Math.min(...eloHistory.map((h) => h.elo), user?.elo ?? 1000);
  const eloRange = maxElo - minElo || 1;

  const providerLabel =
    user?.provider === 'toss' ? '토스' :
    user?.provider === 'kakao' ? '카카오' :
    user?.provider === 'google' ? '구글' : '게스트';

  return (
    <div className="relative flex min-h-screen flex-col bg-background-dark">
      <div className="fixed bottom-0 left-0 right-0 h-1 hazard-stripe z-[60]" />

      {/* 헤더 */}
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-primary/10">
        <button onClick={() => router.back()} className="size-10 flex items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold tracking-tight">전투 기록부</h2>
        <button onClick={logout} className="text-danger text-xs font-bold">로그아웃</button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* 프로필 섹션 */}
        <div className="relative p-6 flex flex-col items-center overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[240px] text-primary">dangerous</span>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse opacity-50" />
            <div className="absolute inset-0 rounded-full border-2 border-primary scale-110" />
            <div className="w-32 h-32 rounded-full border-4 border-background-dark bg-primary/20 flex items-center justify-center text-5xl relative z-10">
              {user?.provider === 'toss' ? '🏦' : user?.provider === 'kakao' ? '💬' : '👤'}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-background-dark rounded-full p-1 border-4 border-background-dark z-20">
              <span className="material-symbols-outlined text-sm font-bold">verified</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-2xl font-bold">{user?.nickname ?? '지도자'}</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span
                className="bg-primary/20 text-xs font-bold px-2 py-0.5 rounded border border-primary/30 tracking-widest uppercase"
                style={{ color: (profile ? getTier(profile.elo) : tier)?.color }}
              >
                {profile ? `${profile.rank}위 · ` : ''}티어: {(profile ? getTier(profile.elo) : tier)?.name}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-2">{providerLabel} 계정</p>
          </div>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-3 gap-3 px-4 py-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-card-dark rounded-xl animate-pulse" />
            ))
          ) : error ? (
            <>
              <div className="col-span-3 bg-card-dark rounded-xl p-6 border border-white/5 text-center">
                <span className="material-symbols-outlined text-slate-500 text-3xl mb-2">cloud_off</span>
                <p className="text-sm text-slate-400 font-bold">서버 연결 불가</p>
                <p className="text-[10px] text-slate-500 mt-1">오프라인이거나 서버 점검 중입니다</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-card-dark p-4 rounded-xl border border-primary/5">
                <p className="text-slate-400 text-[10px] font-bold tracking-wider">총 경기</p>
                <p className="text-xl font-black text-primary mt-1">{stats?.totalGames ?? 0}</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">{stats?.wins ?? 0}승 {stats?.losses ?? 0}패</p>
              </div>
              <div className="bg-card-dark p-4 rounded-xl border border-primary/5">
                <p className="text-slate-400 text-[10px] font-bold tracking-wider">승률</p>
                <p className="text-xl font-black text-primary mt-1">{stats?.winRate ?? 0}%</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-1">
                  {CHARACTER_MAP[stats?.favoriteCharacterId ?? 'trump']?.flag}
                </p>
              </div>
              <div className="bg-card-dark p-4 rounded-xl border border-primary/5">
                <p className="text-slate-400 text-[10px] font-bold tracking-wider">연승</p>
                <p className="text-xl font-black text-primary mt-1">{stats?.currentStreak ?? 0}</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">최고 {stats?.maxStreak ?? 0}연승</p>
              </div>
            </>
          )}
        </div>

        {/* ELO 차트 */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold tracking-widest text-slate-300">ELO 변화 추이</h3>
            <span className="text-primary text-xs font-bold">{(profile?.elo ?? user?.elo ?? 1000).toLocaleString()} 점</span>
          </div>
          <div className="w-full h-32 rounded-xl border border-primary/10 relative overflow-hidden flex items-end px-2 pb-2 gap-0.5 bg-primary/5">
            {eloHistory.length > 0 ? eloHistory.map((h, i) => {
              const heightPct = ((h.elo - minElo) / eloRange) * 0.8 + 0.2;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{ height: `${heightPct * 100}%`, backgroundColor: `rgba(249,212,6,${0.2 + heightPct * 0.5})` }}
                />
              );
            }) : Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-primary/10" style={{ height: '20%' }} />
            ))}
          </div>
        </div>

        {/* 최근 전투 기록 */}
        <div className="mt-8 px-4">
          <h3 className="text-sm font-bold tracking-widest text-slate-300 mb-4">최근 전투 기록</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-card-dark/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-slate-500 text-sm text-center py-8">전투 기록을 불러올 수 없습니다</p>
          ) : (profile?.recentGames ?? []).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">아직 전투 기록이 없습니다. 출전하세요! 🚀</p>
          ) : (
            <div className="space-y-3">
              {(profile?.recentGames ?? []).map((game) => (
                <div key={game.id} className="bg-card-dark/50 p-4 rounded-xl border border-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded flex items-center justify-center ${game.result === 'win' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      <span className="text-2xl">{CHARACTER_MAP[game.characterId]?.flag ?? '👤'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">vs. {game.opponentNickname}</p>
                      <p className="text-[10px] text-slate-500">{new Date(game.playedAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2 py-1 rounded tracking-tighter ${
                      game.result === 'win' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                    }`}>
                      {game.result === 'win' ? '승리' : '패배'}
                    </span>
                    <p className={`text-xs font-bold mt-1 ${game.eloChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {game.eloChange > 0 ? '+' : ''}{game.eloChange} ELO
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
