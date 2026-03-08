'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { CHARACTER_MAP } from '@/config/characters';
import type { MatchedPayload } from '@/hooks/useSocket';
import type { GameEvent, GameState } from '@/types/game';

function MatchmakingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, initialized } = useAuth();

  const mode = params.get('mode') ?? 'online_1v1';
  const p1Id = params.get('p1') ?? 'trump';
  const myChar = CHARACTER_MAP[p1Id];

  const [searchTime, setSearchTime] = useState(0);
  const [ping] = useState(Math.floor(Math.random() * 40) + 15);
  const [socketError, setSocketError] = useState<string | null>(null);

  const handleMatched = useCallback(
    (payload: MatchedPayload) => {
      router.push(
        `/game/${payload.roomId}?mode=${mode}&p1=${p1Id}&p2=${payload.opponentCharacterId}&playerIdx=${payload.playerIdx}`
      );
    },
    [router, mode, p1Id]
  );

  const { joinQueue, leaveQueue } = useSocket({
    onMatched: handleMatched,
    onGameState: (_state: GameState) => {},
    onGameEvent: (_event: GameEvent) => {},
    onError: (err) => setSocketError(err.message),
  });

  useEffect(() => {
    if (!initialized) return;
    if (!user) { router.replace('/'); return; }
  }, [user, initialized, router]);

  useEffect(() => {
    if (!user) return;
    joinQueue({
      userId: user.userId,
      elo: user.elo,
      characterId: p1Id,
      nickname: user.nickname,
    });
    return () => leaveQueue();
  }, [user, p1Id, joinQueue, leaveQueue]);

  useEffect(() => {
    const timer = setInterval(() => setSearchTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background-dark max-w-[430px] mx-auto border-x border-slate-800">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-danger to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-danger to-transparent opacity-50" />

      {/* 헤더 */}
      <header className="flex items-center justify-between p-4 pt-10 border-b border-slate-800">
        <span className="material-symbols-outlined text-danger text-3xl">dangerous</span>
        <h2 className="text-danger text-lg font-black tracking-widest text-center uppercase">
          핵 대치 중
        </h2>
        <button
          onClick={() => router.back()}
          className="size-10 flex items-center justify-center rounded-full bg-slate-800/50"
        >
          <span className="material-symbols-outlined text-slate-300">close</span>
        </button>
      </header>

      {/* 메인 */}
      <main className="flex-1 flex flex-col items-center justify-between p-6">
        <div className="w-full space-y-2">
          <h1 className="text-primary tracking-tighter text-4xl font-black leading-none text-center italic">
            상대 탐색 중...
          </h1>
          <p className="text-slate-500 text-sm text-center font-bold tracking-[0.2em] uppercase">
            {formatTime(searchTime)} — 전세계 적 스캔 중
          </p>
          {socketError && (
            <p className="text-danger text-xs text-center font-bold animate-pulse">
              ⚠ {socketError}
            </p>
          )}
        </div>

        {/* VS 섹션 */}
        <div className="w-full flex items-center justify-between gap-4 py-8">
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="size-32 rounded-full border-4 border-primary bg-primary/10 flex items-center justify-center text-6xl">
                {myChar?.flag ?? '👤'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-primary text-background-dark px-2 py-0.5 rounded text-[10px] font-black italic">
                {myChar?.type === 'power' ? '파워' :
                 myChar?.type === 'speed' ? '스피드' :
                 myChar?.type === 'tech' ? '기술' :
                 myChar?.type === 'defense' ? '수비' : '균형'}
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-xl font-black">나</p>
              <p className="text-primary text-xs font-bold uppercase tracking-wider">ELO: {user?.elo}</p>
            </div>
          </div>

          <div className="text-4xl font-black italic text-danger/40">VS</div>

          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="size-32 rounded-full border-4 border-slate-700 border-dashed flex items-center justify-center bg-slate-800/20">
              <span className="material-symbols-outlined text-5xl text-slate-600 animate-pulse">radar</span>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-sm font-black italic">표적 탐색 중...</p>
              <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">핑: {ping}ms</p>
            </div>
          </div>
        </div>

        {/* 작전 브리핑 */}
        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="material-symbols-outlined text-primary">description</span>
            <h3 className="font-black italic text-xs tracking-widest uppercase">작전 브리핑</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">전장</p>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded bg-slate-800 flex items-center justify-center text-sm">🌐</div>
                <p className="text-xs font-bold">UN 총회장</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">무기</p>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded bg-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">rocket_launch</span>
                </div>
                <p className="text-xs font-bold">표준 핵미사일</p>
              </div>
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded p-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">warning</span>
            <p className="text-[10px] text-primary font-bold uppercase">상호확증파괴 프로토콜 활성화</p>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="p-6 pt-2">
        <button
          onClick={() => { leaveQueue(); router.back(); }}
          className="w-full bg-danger hover:bg-red-600 text-white py-4 rounded-xl font-black text-lg tracking-widest uppercase shadow-lg shadow-danger/20 flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined">cancel</span>
          매칭 취소
        </button>
        <p className="mt-4 text-[10px] text-center text-slate-500 font-bold tracking-tighter">
          위성 연결 안정 • 신호 암호화 완료 • 토스 앱인토스
        </p>
      </footer>
    </div>
  );
}

export default function MatchmakingPage() {
  return (
    <Suspense>
      <MatchmakingInner />
    </Suspense>
  );
}
