'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import NewsTickerBar from '@/components/ui/NewsTickerBar';
import BottomNav from '@/components/ui/BottomNav';
import AdBanner from '@/components/ads/AdBanner';
import { getTier } from '@/lib/elo';
import type { GetProfileResponse } from '@/types/api';

const LEGAL_OVERLAY_DURATION = 4000;

const GAME_MODES = [
  {
    id: 'online_1v1',
    label: '1대1 핵전쟁',
    sub: '온라인 랭크 매칭',
    bg: 'from-blue-900/60 to-transparent',
    border: 'border-accent-cyan/50',
    dot: 'bg-green-500',
    emoji: '⚔️',
    href: '/character-select?mode=online_1v1&player=1',
  },
  {
    id: 'online_2v2',
    label: '2대2 동맹전',
    sub: '팀 협력 온라인',
    bg: 'from-primary/20 to-transparent',
    border: 'border-primary/50',
    dot: null,
    emoji: '🤝',
    href: '/character-select?mode=online_2v2&player=1',
  },
  {
    id: 'vs_ai',
    label: 'AI 훈련소',
    sub: '혼자 연습하기',
    bg: 'from-slate-900/80 to-transparent',
    border: 'border-slate-500/30',
    dot: null,
    emoji: '🤖',
    href: '/character-select?mode=vs_ai&player=1',
  },
  {
    id: 'local_1v1',
    label: '같이 하기',
    sub: '화면 분할 대결',
    bg: 'from-slate-900/80 to-transparent',
    border: 'border-slate-500/30',
    dot: null,
    emoji: '👥',
    href: '/character-select?mode=local_1v1&player=1',
  },
];

export default function LobbyPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const [showLegal, setShowLegal] = useState(true);
  const [stats, setStats] = useState<{ rank: string; winRate: string; streak: string }>({ rank: '#—', winRate: '—%', streak: '—' });

  useEffect(() => {
    if (!initialized) return;
    if (!user) { router.replace('/'); return; }
    const t = setTimeout(() => setShowLegal(false), LEGAL_OVERLAY_DURATION);
    return () => clearTimeout(t);
  }, [user, initialized, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile/${user.userId}`)
      .then((r) => r.json())
      .then((res: { ok: boolean; data?: GetProfileResponse }) => {
        if (res.ok && res.data) {
          setStats({
            rank: res.data.rank ? `#${res.data.rank}` : '#—',
            winRate: `${res.data.stats?.winRate ?? 0}%`,
            streak: `${res.data.stats?.currentStreak ?? 0}`,
          });
        }
      })
      .catch(() => {/* offline — keep placeholders */});
  }, [user]);

  const tier = user ? getTier(user.elo) : null;

  return (
    <div className="relative flex min-h-screen flex-col bg-background-dark">
      {/* 법적 고지 오버레이 */}
      {showLegal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background-dark/95 backdrop-blur-sm p-8 text-center">
          <div className="max-w-xs border-2 border-primary/40 p-6 rounded-xl bg-card-dark">
            <span className="material-symbols-outlined text-primary text-4xl">gavel</span>
            <h1 className="text-primary font-bold text-lg mb-2 uppercase tracking-widest mt-2">⚠ 이용 안내</h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              이 게임은 정치 풍자·패러디 목적의 픽션입니다.
              등장 캐릭터는 모두 가상이며 실제 인물·단체와 무관합니다.
              어떠한 정치적 입장도 지지하지 않습니다.
            </p>
            <p className="text-[10px] text-primary/50 font-mono italic mt-3 uppercase">
              풍자 안전 연결 확인 중...
            </p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="flex items-center justify-between p-4 pt-10 bg-card-dark/50 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-12 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center text-2xl">
              {user?.provider === 'toss' ? '🏦' : user?.provider === 'kakao' ? '💬' : '👤'}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-accent-cyan text-background-dark text-[10px] px-1 rounded font-bold border border-background-dark">
              {user?.provider === 'toss' ? '토스' : user?.provider === 'kakao' ? '카카오' : '게스트'}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider" style={{ color: tier?.color }}>
              {tier?.name ?? 'Bronze'}
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-tighter font-mono">
              {user?.nickname}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-sm">stars</span>
            <span className="text-primary font-bold text-sm tracking-tight" style={{ color: tier?.color }}>
              {tier?.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500">ELO</span>
            <span className="text-accent-cyan font-mono font-bold text-sm">{user?.elo ?? 1000}</span>
          </div>
        </div>
      </header>

      {/* 뉴스 속보 */}
      <NewsTickerBar />

      {/* 간단 통계 */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        {[
          { label: '세계 순위', value: stats.rank },
          { label: '승률', value: stats.winRate },
          { label: '연승', value: stats.streak },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center justify-center p-3 rounded-lg bg-card-dark border border-white/5">
            <span className="text-[10px] text-slate-500 font-bold tracking-tighter text-center">{stat.label}</span>
            <span className="text-lg font-black text-slate-100 mt-1">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* 게임 모드 그리드 */}
      <main className="flex-1 px-4 pb-24">
        <div className="flex items-center justify-between mb-3 ml-1 mt-2">
          <h3 className="text-xs font-black text-primary/60 uppercase tracking-[0.2em]">전투 모드 선택</h3>
          <span className="text-[10px] font-mono text-slate-500">v1.0.0</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GAME_MODES.map((mode) => (
            <Link
              key={mode.id}
              href={mode.href}
              className={`group relative aspect-square rounded-xl overflow-hidden bg-card-dark border border-white/5 transition-all`}
            >
              <div className={`absolute inset-0 bg-gradient-to-t ${mode.bg} z-10`} />
              <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30 group-hover:opacity-50 transition-opacity">
                {mode.emoji}
              </div>
              <div className="absolute bottom-3 left-3 z-20">
                <p className="text-white text-base font-black leading-tight italic tracking-tighter">{mode.label}</p>
                <p className="text-[10px] font-bold" style={{ color: mode.dot ? '#06f9e9' : '#f9d406' }}>{mode.sub}</p>
              </div>
              {mode.dot && (
                <div className="absolute top-2 right-2 z-20">
                  <span className={`flex h-2 w-2 rounded-full ${mode.dot} animate-pulse`} />
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* 소식 카드 */}
        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
          <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-background-dark shrink-0">
            <span className="material-symbols-outlined font-bold">satellite_alt</span>
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-primary uppercase">시즌 소식</h4>
            <p className="text-sm font-medium text-slate-300">새 시즌 개막 — 랭크 매칭이 열렸습니다!</p>
          </div>
          <span className="material-symbols-outlined text-slate-500">chevron_right</span>
        </div>

        <div className="mt-4 flex justify-center">
          <AdBanner slot="lobby_banner" />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
