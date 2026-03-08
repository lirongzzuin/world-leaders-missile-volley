'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CHARACTERS } from '@/config/characters';
import type { CharacterConfig } from '@/types/game';

function StatBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-primary/70 text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="text-primary text-xs font-black">{value * 2}/10</span>
      </div>
      <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{
            width: `${(value / max) * 100}%`,
            boxShadow: value === max ? '0 0 8px rgba(249,212,6,0.6)' : undefined,
          }}
        />
      </div>
    </div>
  );
}

function CharacterSelectInner() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get('mode') ?? 'vs_ai';
  const player = params.get('player') ?? '1';

  const [selectedId, setSelectedId] = useState(CHARACTERS[0].id);
  const selected: CharacterConfig = CHARACTERS.find((c) => c.id === selectedId) ?? CHARACTERS[0];

  const handleDeploy = () => {
    if (mode === 'local_1v1' && player === '1') {
      router.push(`/character-select?mode=${mode}&player=2&p1=${selectedId}`);
    } else if (mode === 'local_1v1' && player === '2') {
      const p1 = params.get('p1') ?? CHARACTERS[0].id;
      router.push(`/game/local?mode=${mode}&p1=${p1}&p2=${selectedId}`);
    } else if (mode === 'vs_ai') {
      router.push(`/difficulty?p1=${selectedId}`);
    } else {
      router.push(`/matchmaking?mode=${mode}&p1=${selectedId}`);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background-dark">
      {/* 풍자 워터마크 */}
      <div className="fixed inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
        <div className="text-[8rem] font-black whitespace-nowrap -rotate-45 text-white">풍자 패러디</div>
      </div>

      {/* 헤더 */}
      <div className="relative z-10 flex items-center p-4 pb-2 justify-between">
        <button
          onClick={() => router.back()}
          className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-primary text-xl font-black leading-tight tracking-widest flex-1 text-center pr-10 uppercase italic">
          {player === '2' ? '2P — 지도자 선택' : '지도자를 선택하세요'}
        </h2>
      </div>

      {/* 캐릭터 프리뷰 */}
      <div className="px-4 relative z-10">
        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border-2 border-primary/30 bg-gradient-to-b from-background-dark/80 to-background-dark">
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="relative w-64 h-64 border border-primary rounded-full flex items-center justify-center">
              <div className="border border-primary rounded-full w-48 h-48" />
              <div className="absolute w-full h-px bg-primary" />
              <div className="absolute h-full w-px bg-primary" />
            </div>
          </div>

          <div className="absolute top-4 left-4 z-20">
            <div className="bg-danger text-white text-[10px] font-black px-2 py-0.5 rounded-sm -rotate-[5deg] shadow-lg border border-white/20">
              풍자 패러디
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-32 h-32 rounded-full mx-auto flex items-center justify-center text-7xl border-4 shadow-2xl"
                style={{ backgroundColor: selected.colors.primary + '22', borderColor: selected.colors.primary, boxShadow: `0 0 40px ${selected.colors.primary}44` }}
              >
                {selected.flag}
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-0 right-0 text-center z-20">
            <p className="text-white text-xl font-black">{selected.name}</p>
            <p className="text-slate-400 text-xs">{selected.country}</p>
          </div>

          <div className="absolute top-4 right-4 bg-primary text-background-dark px-3 py-1 rounded-full font-black text-sm shadow-lg z-20">
            {selected.type === 'power' ? '파워형' :
             selected.type === 'speed' ? '스피드형' :
             selected.type === 'tech' ? '기술형' :
             selected.type === 'defense' ? '수비형' : '균형형'}
          </div>
        </div>
      </div>

      {/* 필살기 정보 */}
      <div className="p-4 relative z-10">
        <div className="flex flex-col items-stretch rounded-xl border border-primary/20 bg-primary/5">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 p-1.5 rounded-lg">
                <span className="material-symbols-outlined text-primary text-xl">rocket_launch</span>
              </div>
              <div>
                <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">필살기</p>
                <p className="text-primary text-lg font-black leading-tight tracking-tight uppercase italic">
                  {selected.special.name}
                </p>
              </div>
            </div>
            <p className="text-slate-100/80 text-sm font-medium">{selected.special.description}</p>
            <p className="text-slate-100/60 text-xs">쿨타임: {selected.special.cooldown}초</p>
          </div>
        </div>
      </div>

      {/* 스탯 */}
      <div className="px-6 pb-4 space-y-3 relative z-10">
        <StatBar label="스피드" value={selected.stats.speed} />
        <StatBar label="파워" value={selected.stats.power} />
        <StatBar label="점프" value={selected.stats.jump} />
      </div>

      {/* 캐릭터 캐러셀 */}
      <div className="relative z-10 pt-2">
        <p className="px-4 pb-2 text-[10px] font-bold text-primary/50 uppercase tracking-[0.2em]">
          지도자 선택
        </p>
        <div className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar snap-x">
          {CHARACTERS.map((char) => {
            const isSelected = char.id === selectedId;
            return (
              <button
                key={char.id}
                className="shrink-0 snap-center"
                onClick={() => setSelectedId(char.id)}
              >
                <div
                  className={`size-16 rounded-full p-0.5 ${isSelected ? 'ring-4' : 'opacity-60'} flex items-center justify-center transition-all`}
                  style={{
                    backgroundColor: char.colors.primary + '22',
                    boxShadow: isSelected ? `0 0 12px ${char.colors.primary}88` : undefined,
                  }}
                >
                  <span className="text-2xl">{char.flag}</span>
                </div>
                <p className="text-[8px] text-center text-slate-400 mt-1 font-bold">{char.name.split(' ')[0]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 출전 버튼 */}
      <div className="sticky bottom-0 p-4 bg-background-dark/90 backdrop-blur-xl border-t border-white/10 z-30">
        <button
          onClick={handleDeploy}
          className="w-full bg-primary hover:bg-primary/90 text-background-dark font-black py-4 rounded-xl text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(249,212,6,0.3)] flex items-center justify-center gap-2 mb-3"
        >
          {mode === 'local_1v1' && player === '1' ? '다음: 2P 선택' : '이 지도자로 출전!'}
          <span className="material-symbols-outlined">bolt</span>
        </button>
        <p className="text-[9px] leading-tight text-slate-400 text-center tracking-tighter px-2">
          모든 캐릭터는 풍자·패러디 목적의 가상 인물입니다. 실제 인물과 무관합니다.
        </p>
      </div>
    </div>
  );
}

export default function CharacterSelectPage() {
  return (
    <Suspense>
      <CharacterSelectInner />
    </Suspense>
  );
}
