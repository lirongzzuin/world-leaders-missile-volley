'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CHARACTERS } from '@/config/characters';
import type { AIDifficulty } from '@/types/game';

const DIFFICULTIES: Array<{
  id: AIDifficulty;
  label: string;
  sub: string;
  desc: string;
  icon: string;
  color: string;
  bgColor: string;
}> = [
  {
    id: 'easy',
    label: '평화협상 모드',
    sub: '초록 등급',
    desc: 'AI가 미사일을 보고도 멍때립니다. 가끔 "대화로 해결하자"며 멈추기도 해요.',
    icon: 'potted_plant',
    color: '#22c55e',
    bgColor: 'bg-green-500/10 border-green-500/20',
  },
  {
    id: 'normal',
    label: '냉전 모드',
    sub: '황색 경보',
    desc: 'AI가 물리 법칙을 활용합니다. 가끔 선전포고문을 날리며 심리전도 펼쳐요.',
    icon: 'radar',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10 border-2 border-primary',
  },
  {
    id: 'hard',
    label: '핵전쟁 독트린',
    sub: '🔴 적색 경보',
    desc: '"상호확증파괴만이 답이다." AI가 120% 반사신경으로 자비 없이 달려듭니다.',
    icon: 'warning',
    color: '#ef4444',
    bgColor: 'bg-red-500/10 border-red-500/30',
  },
];

function DifficultyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const p1 = params.get('p1') ?? 'trump';

  // Pick a random opponent different from P1
  const aiOpponent = useMemo(() => {
    const candidates = CHARACTERS.filter((c) => c.id !== p1);
    return candidates[Math.floor(Math.random() * candidates.length)]?.id ?? 'kim';
  }, [p1]);

  const handleSelect = (diff: AIDifficulty) => {
    router.push(`/game/local?mode=vs_ai&p1=${p1}&p2=${aiOpponent}&difficulty=${diff}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background-dark">
      <div className="flex items-center bg-background-dark p-4 pb-2 justify-between border-b border-primary/10">
        <button onClick={() => router.back()} className="text-primary flex size-10 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-primary text-sm font-bold tracking-[0.2em] flex-1 text-center uppercase">AI 위협 단계 설정</h2>
        <div className="size-10" />
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-primary tracking-tighter text-3xl font-black leading-tight uppercase italic">
            얼마나 강한 적을 원하세요?
          </h1>
          <p className="text-primary/60 text-xs font-medium tracking-widest">
            표적 조준 완료. AI 공격성을 설정하세요.
          </p>
        </div>

        <div className="space-y-4">
          {DIFFICULTIES.map((d, i) => (
            <button
              key={d.id}
              onClick={() => handleSelect(d.id)}
              className={`group relative flex items-stretch justify-between gap-4 rounded-xl p-4 border w-full text-left transition-all ${d.bgColor}`}
            >
              {i === 1 && (
                <div className="absolute -top-3 right-4 bg-primary text-background-dark text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  추천
                </div>
              )}
              <div className="flex flex-[2_2_0px] flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm" style={{ color: d.color }}>
                      {d.icon}
                    </span>
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: d.color }}>
                      {d.sub}
                    </p>
                  </div>
                  <p className="text-white text-lg font-black italic">{d.label}</p>
                  <p className="text-slate-400 text-sm leading-snug">{d.desc}</p>
                </div>
              </div>
              <div
                className="flex items-center justify-center rounded-lg p-2 w-20 h-20 border self-center"
                style={{
                  backgroundColor: d.color + '22',
                  borderColor: d.color + '55',
                  animation: d.id === 'hard' ? 'pulse 2s infinite' : undefined,
                }}
              >
                <span className="material-symbols-outlined text-4xl" style={{ color: d.color }}>{d.icon}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-primary/10">
        <p className="text-center text-[10px] text-primary/40 uppercase tracking-[0.3em]">
          겁쟁이는 평화협상을 선택합니다
        </p>
      </div>
    </div>
  );
}

export default function DifficultyPage() {
  return (
    <Suspense>
      <DifficultyInner />
    </Suspense>
  );
}
