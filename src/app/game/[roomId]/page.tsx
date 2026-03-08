'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { GameConfig } from '@/types/game';
import { CHARACTER_MAP } from '@/config/characters';
import { calculateNewElos } from '@/lib/elo';
import { share } from '@/lib/apps-in-toss';
import { useAuth } from '@/hooks/useAuth';
import AdBanner from '@/components/ads/AdBanner';

const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0c05]">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">🚀</div>
        <p className="text-primary font-black tracking-widest animate-pulse">발사 준비 중...</p>
      </div>
    </div>
  ),
});

type MatchResult = { winner: 0 | 1 };

const MODE_LABELS: Record<string, string> = {
  local_1v1: '로컬 1대1',
  online_1v1: '온라인 랭크전',
  online_2v2: '2대2 동맹전',
  vs_ai: 'AI 대전',
  practice: '연습',
};

function GamePageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const mode = (params.get('mode') ?? 'vs_ai') as GameConfig['mode'];
  const p1Id = params.get('p1') ?? 'trump';
  const p2Id = params.get('p2') ?? 'kim';
  const difficulty = (params.get('difficulty') ?? 'normal') as GameConfig['aiDifficulty'];

  const [result, setResult] = useState<MatchResult | null>(null);
  const [showAd, setShowAd] = useState(false);

  const p1 = CHARACTER_MAP[p1Id];
  const p2 = CHARACTER_MAP[p2Id];

  const config: GameConfig = {
    mode,
    player1CharacterId: p1Id,
    player2CharacterId: p2Id,
    aiDifficulty: difficulty,
  };

  const handleMatchOver = useCallback((winner: 0 | 1) => {
    setResult({ winner });
    setShowAd(true);
    setTimeout(() => setShowAd(false), 5000);
  }, []);

  if (result !== null) {
    const winnerChar = result.winner === 0 ? p1 : p2;
    const loserChar = result.winner === 0 ? p2 : p1;
    const isPlayerWin = result.winner === 0;

    // ELO 변동 계산
    const myElo = user?.elo ?? 1000;
    const opponentElo = 1000;
    const eloResult = calculateNewElos(
      isPlayerWin ? myElo : opponentElo,
      isPlayerWin ? opponentElo : myElo
    );
    const eloChange = isPlayerWin ? eloResult.winnerChange : eloResult.loserChange;

    const handleShare = async () => {
      const msg = `${p1?.name}(으)로 ${p2?.name}에게 ${isPlayerWin ? '승리' : '패배'}! ELO ${eloChange > 0 ? '+' : ''}${eloChange} | 세계 지도자 핵미사일 배구 🚀`;
      await share(msg);
    };

    const handleRematch = () => {
      setResult(null);
      setShowAd(false);
    };

    return (
      <div className="relative flex min-h-screen flex-col bg-background-dark">
        {/* 광고 인터스티셜 */}
        {showAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative">
              <AdBanner slot="result_interstitial" />
              <button onClick={() => setShowAd(false)} className="absolute top-2 right-2 text-white text-xs bg-black/60 px-2 py-1 rounded">
                건너뛰기
              </button>
            </div>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-center p-4 justify-between z-10">
          <button onClick={() => router.push('/lobby')} className="size-12 flex items-center justify-start">
            <span className="material-symbols-outlined cursor-pointer text-slate-100">close</span>
          </button>
          <h2 className="text-sm font-bold uppercase tracking-widest flex-1 text-center opacity-70">전투 결과</h2>
          <button onClick={handleShare} className="size-10 flex items-center justify-end">
            <span className="material-symbols-outlined text-primary">share</span>
          </button>
        </div>

        {/* 승리 / 패배 배너 */}
        <div className="relative flex flex-col items-center pt-2 pb-6">
          <div
            className="absolute inset-0 -z-10 opacity-60"
            style={{ background: `radial-gradient(circle, ${isPlayerWin ? 'rgba(249,212,6,0.4)' : 'rgba(239,68,68,0.3)'} 0%, rgba(35,32,15,1) 70%)` }}
          />
          <h1
            className="font-pixel text-4xl leading-tight px-4 text-center mb-4 pixel-shadow"
            style={{ color: isPlayerWin ? '#f9d406' : '#ef4444' }}
          >
            {isPlayerWin ? '승리!' : '패배...'}
          </h1>

          {/* 대전 카드 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex flex-col items-center gap-1">
              <div className={`text-5xl ${isPlayerWin ? 'animate-bounce' : 'opacity-60'}`}>{p1?.flag}</div>
              <span className="text-[10px] font-bold text-primary">{p1?.name}</span>
            </div>
            <div className="text-white/30 font-pixel text-sm">VS</div>
            <div className="flex flex-col items-center gap-1">
              <div className={`text-5xl ${!isPlayerWin ? 'animate-bounce' : 'opacity-60'}`}>{p2?.flag}</div>
              <span className="text-[10px] font-bold text-slate-400">{p2?.name}</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 font-bold">
            {isPlayerWin ? winnerChar?.emotes.win : loserChar?.emotes.lose}
          </p>
        </div>

        {/* ELO 패널 */}
        <div className="px-4 space-y-3 pb-32">
          <div className={`rounded-xl p-5 flex flex-col items-center border ${isPlayerWin ? 'bg-primary/5 border-primary/20' : 'bg-danger/5 border-danger/20'}`}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-4xl font-black font-pixel ${isPlayerWin ? 'text-primary' : 'text-danger'}`}>
                {eloChange > 0 ? '+' : ''}{eloChange}
              </span>
              <span className="text-slate-400 text-sm font-bold tracking-tighter">ELO 점수</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              {isPlayerWin ? '승리! 랭킹이 올라갑니다 🎉' : '다음엔 반드시 복수하세요 💪'}
            </p>
          </div>

          {/* 경기 요약 */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-base">경기 요약</h3>
                <p className="text-slate-500 text-[10px] tracking-wider">UN 총회장</p>
              </div>
              {isPlayerWin && (
                <div className="bg-primary text-background-dark font-pixel text-[10px] py-1 px-3 rounded-full animate-pulse">MVP</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <span className="text-slate-400 text-[10px] font-bold">모드</span>
                <p className="text-white text-sm font-bold mt-1">{MODE_LABELS[mode] ?? mode}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <span className="text-slate-400 text-[10px] font-bold">난이도</span>
                <p className="text-white text-sm font-bold mt-1">
                  {difficulty === 'easy' ? '평화협상' : difficulty === 'hard' ? '핵전쟁' : '냉전'}
                </p>
              </div>
            </div>
          </div>

          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-bold active:bg-primary/10"
          >
            <span className="material-symbols-outlined text-lg">share</span>
            결과 공유하기
          </button>
        </div>

        {/* 액션 바 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-12 max-w-[430px] mx-auto">
          <button
            onClick={handleRematch}
            className="w-full bg-primary text-background-dark h-14 rounded-xl flex items-center justify-center gap-3 font-black text-base shadow-[0_5px_0_0_#b39704] active:shadow-none active:translate-y-1 transition-all mb-2"
          >
            <span className="material-symbols-outlined font-bold">refresh</span>
            리매치
          </button>
          <button
            onClick={() => router.push('/lobby')}
            className="w-full bg-white/10 text-slate-100 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm tracking-wide"
          >
            작전실로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0c05]">
      <GameCanvas config={config} onMatchOver={handleMatchOver} />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense>
      <GamePageInner />
    </Suspense>
  );
}
