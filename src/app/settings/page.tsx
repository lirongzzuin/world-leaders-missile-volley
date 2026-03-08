'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/ui/BottomNav';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background-dark">
      <header className="sticky top-0 z-40 flex items-center bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-primary/10">
        <button onClick={() => router.back()} className="size-10 flex items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold tracking-tight">설정</h2>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar px-4 pt-4 space-y-3">
        {/* 계정 정보 */}
        <div className="bg-card-dark rounded-xl p-4 border border-primary/5">
          <h3 className="text-[10px] text-primary/60 font-bold tracking-widest uppercase mb-3">계정 정보</h3>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl border-2 border-primary/30">
              {user?.provider === 'toss' ? '🏦' : user?.provider === 'kakao' ? '💬' : '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.nickname ?? '게스트'}</p>
              <p className="text-[10px] text-slate-500">
                {user?.provider === 'toss' ? '토스' : user?.provider === 'kakao' ? '카카오' : user?.provider === 'google' ? '구글' : '게스트'} 계정
              </p>
            </div>
            <span className="text-primary text-xs font-bold">ELO {user?.elo ?? 1000}</span>
          </div>
        </div>

        {/* 게임 설정 */}
        <div className="bg-card-dark rounded-xl p-4 border border-primary/5 space-y-1">
          <h3 className="text-[10px] text-primary/60 font-bold tracking-widest uppercase mb-3">게임 설정</h3>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 text-xl">volume_up</span>
              <div>
                <p className="text-sm font-bold">효과음</p>
                <p className="text-[10px] text-slate-500">게임 효과음 및 배경음</p>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${soundEnabled ? 'bg-primary' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 text-xl">vibration</span>
              <div>
                <p className="text-sm font-bold">진동</p>
                <p className="text-[10px] text-slate-500">타격 시 진동 피드백</p>
              </div>
            </div>
            <button
              onClick={() => setHapticEnabled(!hapticEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${hapticEnabled ? 'bg-primary' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${hapticEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="bg-card-dark rounded-xl p-4 border border-primary/5 space-y-1">
          <h3 className="text-[10px] text-primary/60 font-bold tracking-widest uppercase mb-3">앱 정보</h3>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-300">버전</span>
            <span className="text-sm text-slate-500 font-mono">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-300">게임 엔진</span>
            <span className="text-sm text-slate-500 font-mono">Canvas 2D</span>
          </div>

          <div className="pt-2 space-y-2">
            <button className="w-full flex items-center justify-between py-3 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-xl">description</span>
                <span className="text-sm text-slate-300">이용약관</span>
              </div>
              <span className="material-symbols-outlined text-slate-600 text-lg">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between py-3 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-xl">shield</span>
                <span className="text-sm text-slate-300">개인정보처리방침</span>
              </div>
              <span className="material-symbols-outlined text-slate-600 text-lg">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between py-3 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-xl">gavel</span>
                <span className="text-sm text-slate-300">오픈소스 라이선스</span>
              </div>
              <span className="material-symbols-outlined text-slate-600 text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* 풍자 고지 */}
        <div className="p-4 bg-danger/5 border border-danger/10 rounded-xl">
          <p className="text-[10px] text-danger/70 leading-relaxed text-center">
            이 게임은 정치 풍자·패러디 목적의 픽션입니다.
            등장 캐릭터는 모두 가상이며 실제 인물·단체와 무관합니다.
          </p>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={() => setShowConfirmLogout(true)}
          className="w-full flex items-center justify-center gap-2 py-4 text-danger text-sm font-bold rounded-xl border border-danger/20 bg-danger/5 active:bg-danger/10"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          로그아웃
        </button>
      </main>

      {/* 로그아웃 확인 모달 */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-xs bg-card-dark rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-center mb-2">로그아웃</h3>
            <p className="text-sm text-slate-400 text-center mb-6">정말 로그아웃하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="flex-1 h-12 rounded-xl bg-white/10 text-slate-300 font-bold"
              >취소</button>
              <button
                onClick={handleLogout}
                className="flex-1 h-12 rounded-xl bg-danger text-white font-bold"
              >로그아웃</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
