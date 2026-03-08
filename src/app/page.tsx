'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SplashPage() {
  const router = useRouter();
  const { user, loading, error, loginWithToss, loginAsGuest, isTossApp } = useAuth();
  const [ageAgreed, setAgeAgreed] = useState(false);
  const [callsign, setCallsign] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (user) router.replace('/lobby');
  }, [user, router]);

  useEffect(() => {
    let n = 0;
    const timer = setInterval(() => {
      n += Math.random() * 8;
      setLoadingProgress(Math.min(95, n));
      if (n >= 95) clearInterval(timer);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  const handleGuestLogin = async () => {
    if (!ageAgreed) return;
    await loginAsGuest(callsign || '익명의핵전사_' + Math.floor(Math.random() * 9999));
  };

  const handleTossLogin = async () => {
    if (!ageAgreed) return;
    await loginWithToss();
  };

  const handleOAuthLogin = async (provider: 'kakao' | 'google') => {
    if (!ageAgreed) return;
    // NextAuth OAuth flow isn't integrated with our localStorage auth yet
    // Use guest mode with provider label as workaround
    const label = provider === 'kakao' ? '카카오' : '구글';
    const nickname = callsign || `${label}유저_${Math.floor(Math.random() * 9999)}`;
    await loginAsGuest(nickname);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background-dark overflow-hidden">
      <div className="absolute inset-0 crt-overlay z-50 mix-blend-overlay pointer-events-none" />

      {/* 미사일 궤적 배경 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg">
          <path d="M 50 600 Q 200 200 350 500" fill="none" stroke="#f9d406" strokeDasharray="8,8" strokeWidth="2" opacity="0.6" />
          <path d="M 350 650 Q 150 300 50 450" fill="none" stroke="#f9d406" strokeDasharray="8,8" strokeWidth="2" opacity="0.4" />
          <circle cx="50" cy="600" fill="#f9d406" opacity="0.7" r="4" />
          <circle cx="350" cy="500" fill="#f9d406" opacity="0.7" r="4" />
          <circle cx="350" cy="650" fill="#ef4444" opacity="0.5" r="4" />
        </svg>
      </div>

      {/* 상단 상태바 */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2 z-20">
        <div className="text-primary/60 text-xs font-mono tracking-widest uppercase">시스템: 온라인</div>
        <div className="text-danger flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">dangerous</span>
          <span className="text-[10px] font-bold tracking-tighter uppercase">핵위험도 MAX</span>
        </div>
      </div>

      {/* 모서리 장식 */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/40" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/40" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/40" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/40" />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-20 gap-6">
        {/* 풍자 딱지 */}
        <div className="border-2 border-danger/60 rounded px-3 py-1 rotate-[-5deg]">
          <span className="text-danger text-[10px] font-black uppercase tracking-widest">
            ⚠ 풍자·패러디 콘텐츠
          </span>
        </div>

        {/* 게임 미리보기 */}
        <div className="relative w-full aspect-video bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
          <div className="relative flex items-end justify-between w-full h-full px-10 pb-4">
            <div className="w-14 h-24 bg-primary/30 rounded-t-full relative flex items-center justify-center text-2xl">🇺🇸</div>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-2xl rotate-12 animate-bounce">🚀</div>
            <div className="w-14 h-24 bg-danger/30 rounded-t-full relative flex items-center justify-center text-2xl">🇰🇵</div>
          </div>
        </div>

        {/* 게임 타이틀 */}
        <div className="text-center">
          <div className="text-primary text-[34px] font-black tracking-tighter leading-none italic drop-shadow-[0_4px_0_rgba(100,80,0,1)]">
            세계 지도자
          </div>
          <div className="text-danger text-[30px] font-black tracking-tight leading-none uppercase border-y-4 border-danger py-1 mt-1">
            핵미사일 배구
          </div>
          <div className="text-slate-500 text-xs font-mono mt-2 tracking-widest">WORLD LEADERS MISSILE VOLLEY</div>
        </div>
      </div>

      {/* 로그인 섹션 */}
      <div className="px-6 pb-16 z-20 space-y-4">
        {/* 풍자 안내 */}
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
          <p className="text-[10px] leading-tight text-danger/80 text-center font-mono">
            이 게임은 정치 풍자 패러디입니다. 등장 캐릭터는 모두 가상의 픽션이며
            실제 인물·사건과 무관합니다. 실제 핵은 발사되지 않습니다. 🕊️
          </p>
        </div>

        {/* 나이 확인 — 큼직하게, 먼저 눈에 띄도록 */}
        <button
          onClick={() => setAgeAgreed(!ageAgreed)}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
            ageAgreed
              ? 'border-primary bg-primary/10'
              : 'border-slate-700 bg-white/5 hover:border-slate-500'
          }`}
        >
          <div className={`size-7 rounded-md flex items-center justify-center border-2 shrink-0 transition-all ${
            ageAgreed ? 'bg-primary border-primary' : 'border-slate-500 bg-transparent'
          }`}>
            {ageAgreed && <span className="material-symbols-outlined text-background-dark text-lg font-bold">check</span>}
          </div>
          <div className="text-left">
            <p className={`text-sm font-black ${ageAgreed ? 'text-primary' : 'text-slate-300'}`}>
              만 14세 이상입니다 (필수)
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">이용 약관 및 개인정보 처리방침에 동의합니다</p>
          </div>
        </button>

        {/* 닉네임 입력 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-primary/70 text-[10px] font-bold font-mono tracking-widest uppercase mb-2">
            전사 코드네임 (선택)
          </p>
          <input
            className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:outline-none focus:border-primary placeholder:text-white/20 font-mono text-sm"
            placeholder="닉네임을 입력하세요..."
            value={callsign}
            onChange={(e) => setCallsign(e.target.value.slice(0, 12))}
            maxLength={12}
          />
        </div>

        {/* 로그인 버튼들 */}
        <div className="flex flex-col gap-3">
          {isTossApp ? (
            /* Toss 환경: 자동 로그인 진행 중 표시 */
            <div className="flex items-center justify-center gap-3 w-full h-12 bg-primary/20 text-primary rounded-lg font-black text-sm animate-pulse">
              <span className="text-xl">🏦</span>
              토스 계정으로 자동 연결 중...
            </div>
          ) : (
            /* 일반 환경: 모든 로그인 옵션 표시 */
            <>
              <button
                onClick={() => handleOAuthLogin('kakao')}
                disabled={!ageAgreed}
                className="flex items-center justify-center gap-3 w-full h-12 bg-kakao-yellow text-kakao-label rounded-lg font-bold text-sm disabled:opacity-40 active:opacity-80 transition-opacity"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.27 6.054l-.841 3.097c-.033.12.038.243.16.273.04.01.08.01.121 0a.247.247 0 00.187-.075l3.645-2.427c.477.062.964.093 1.458.093 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                </svg>
                카카오로 시작하기
              </button>

              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={!ageAgreed}
                className="flex items-center justify-center gap-3 w-full h-12 bg-white text-slate-900 rounded-lg font-bold text-sm border border-slate-200 disabled:opacity-40 active:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                구글로 시작하기
              </button>

              <button
                onClick={handleGuestLogin}
                disabled={!ageAgreed || loading}
                className="flex items-center justify-center gap-3 w-full h-12 bg-white/10 text-slate-100 rounded-lg font-bold text-sm disabled:opacity-40 border border-white/10 active:bg-white/20"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                게스트로 플레이
              </button>
            </>
          )}
        </div>

        {/* 법적 링크 */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <a href="#" className="underline underline-offset-2 hover:text-primary">이용약관</a>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <a href="#" className="underline underline-offset-2 hover:text-primary">개인정보처리방침</a>
        </div>

        {/* 로딩 바 */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-primary/80 text-[10px] font-mono uppercase tracking-widest">발사 시퀀스 초기화 중...</span>
            <span className="text-primary text-[10px] font-mono">{Math.round(loadingProgress)}%</span>
          </div>
          <div className="w-full h-3 bg-military/50 border border-primary/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(249,212,6,0.5)] transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>

        <p className="text-[9px] text-primary/40 text-center tracking-tight leading-relaxed font-mono">
          이 게임에 등장하는 모든 캐릭터는 풍자·패러디 목적의 가상 픽션 캐릭터입니다.
          실제 인물이나 단체와 관계없으며 정치적 의도가 없습니다.
        </p>
      </div>

      {error && (
        <div className="fixed bottom-24 left-4 right-4 max-w-[430px] mx-auto bg-danger/20 border border-danger text-danger text-sm p-3 rounded-lg z-50 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
