'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/ui/BottomNav';
import { TIERS } from '@/lib/elo';
import { CHARACTER_MAP } from '@/config/characters';
import { useAuth } from '@/hooks/useAuth';
import type { GetLeaderboardResponse, LeaderboardEntry, RankingPeriod } from '@/types/api';

type Tab = RankingPeriod;

const TAB_LABELS: Record<Tab, string> = {
  all: '전체',
  weekly: '이번 주',
  monthly: '이번 달',
};

const RANK_COLORS: Record<number, string> = {
  1: '#f9d406',
  2: '#9ca3af',
  3: '#92400e',
};

export default function RankingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/ranking?period=${tab}&limit=50`)
      .then((r) => r.json())
      .then((res: { ok: boolean; data?: GetLeaderboardResponse }) => {
        if (res.ok && res.data) {
          setEntries(res.data.entries);
          setCachedAt(res.data.cachedAt);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [tab]);

  const myEntry = entries.find((e) => e.userId === user?.userId);

  return (
    <div className="relative flex h-screen flex-col bg-background-dark max-w-[430px] mx-auto border-x border-accent-muted/20 overflow-hidden">
      <header className="flex items-center bg-background-dark p-4 pb-2 justify-between shrink-0">
        <button onClick={() => router.back()} className="size-10 flex items-center justify-center rounded-full hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-primary text-xl font-black tracking-[0.1em] flex-1 text-center uppercase">세계 패권 순위</h1>
        <div className="w-10" />
      </header>

      {/* 탭 */}
      <nav className="shrink-0 border-b border-white/10 flex px-4">
        {(['all', 'weekly', 'monthly'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex flex-col items-center pb-3 pt-4 flex-1 border-b-4 font-extrabold tracking-wider text-sm transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col pb-24">
        {/* 내 순위 */}
        <div className="p-4 shrink-0">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-primary p-4 shadow-lg">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-background-dark bg-background-dark/10 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                  #{myEntry?.rank ?? '—'} 위
                </span>
                <p className="text-background-dark text-lg font-black">{user?.nickname ?? '나'}</p>
              </div>
              <p className="text-background-dark/70 text-xs font-bold uppercase tracking-widest">
                ELO: {(myEntry?.elo ?? user?.elo ?? 1000).toLocaleString()}
              </p>
            </div>
            <div className="size-12 rounded-lg bg-background-dark/20 border-2 border-background-dark/30 flex items-center justify-center text-2xl">
              {myEntry ? (CHARACTER_MAP[myEntry.favoriteCharacterId]?.flag ?? '👤') : '👤'}
            </div>
          </div>
        </div>

        {/* 리더보드 */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between pb-4 pt-2">
            <h3 className="text-xs font-black text-slate-100 tracking-[0.2em] uppercase opacity-60">최고 지도자들</h3>
            {cachedAt && (
              <span className="text-[9px] text-slate-600 font-bold">
                {new Date(cachedAt).toLocaleTimeString('ko-KR')} 기준
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-card-dark/40 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="material-symbols-outlined text-slate-500 text-4xl">cloud_off</span>
              <p className="text-sm text-slate-400 font-bold">순위를 불러올 수 없습니다</p>
              <p className="text-[10px] text-slate-500">서버 연결이 불안정합니다</p>
              <button
                onClick={() => { setLoading(true); setError(false); fetch(`/api/ranking?period=${tab}&limit=50`).then(r => r.json()).then((res: { ok: boolean; data?: GetLeaderboardResponse }) => { if (res.ok && res.data) { setEntries(res.data.entries); setCachedAt(res.data.cachedAt); } else setError(true); }).catch(() => setError(true)).finally(() => setLoading(false)); }}
                className="mt-2 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg"
              >
                다시 시도
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <span className="material-symbols-outlined text-slate-500 text-3xl">leaderboard</span>
              <p className="text-sm text-slate-400 font-bold">아직 순위 데이터가 없습니다</p>
              <p className="text-[10px] text-slate-500">첫 번째 지도자가 되어보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    entry.rank <= 3 ? 'bg-card-dark border-l-4' : 'bg-card-dark/40 border-l-4 border-transparent'
                  } ${entry.userId === user?.userId ? 'ring-1 ring-primary/40' : ''}`}
                  style={entry.rank <= 3 ? { borderLeftColor: RANK_COLORS[entry.rank] } : undefined}
                >
                  <div className="flex items-center justify-center w-8 shrink-0">
                    {entry.rank === 1 ? (
                      <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
                    ) : (
                      <span className="font-black italic" style={{ color: RANK_COLORS[entry.rank] ?? '#6b7280' }}>
                        {String(entry.rank).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="size-10 rounded bg-white/10 shrink-0 flex items-center justify-center text-xl">
                    {CHARACTER_MAP[entry.favoriteCharacterId]?.flag ?? '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold truncate">
                      {entry.nickname}
                      {entry.userId === user?.userId && <span className="text-primary ml-1 text-[10px]">• 나</span>}
                    </p>
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TIERS.find((t) => t.name === entry.tier)?.color ?? '#9ca3af' }}>
                      {entry.tier}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black tracking-tighter" style={{ color: RANK_COLORS[entry.rank] ?? '#9ca3af' }}>
                      {entry.elo.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold">{entry.wins}승 {entry.winRate}%</p>
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
