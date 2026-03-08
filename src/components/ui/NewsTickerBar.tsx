'use client';

const HEADLINES = [
  '🔴 속보: 트럼프, 관세 미사일 2단 분리 발사 성공 · 김정은, 주체 로켓으로 역대급 스파이크 · 젤렌스키, 히마스 다이브로 관중 기립',
  '⚡ 기밀: 시진핑 만리장성 방어막 가동 — 전문가들 경악 · 마크롱 외교 스핀, NATO 동맹국들 어리둥절',
  '🚨 업데이트: 푸틴 킨잘 대시 신기록 수립 · 모디 아그니 커브, 탄도 물리법칙 완전히 무시',
  '📡 첩보: 멜로니 로마의 대포 마하 3 돌파 · 숄츠 패트리어트 방패로 ICBM 요격 성공',
  '🌐 단독: 이재명 현무 스매시로 경기장 바닥 균열 · 하메네이 순교 발리, 수직으로 솟구쳐',
  '💥 여론조사: 한국인 74% "가장 무서운 지도자는 김정은" — 게임 속에서도 핵 위력 재확인',
  '📊 랭킹: 이번 주 가장 많이 선택된 캐릭터 1위 트럼프, 2위 김정은, 3위 이재명',
];

export default function NewsTickerBar() {
  const ticker = HEADLINES.join('  •  ');
  return (
    <div className="bg-danger/10 border-y border-danger/20 py-1.5 overflow-hidden">
      <div className="animate-marquee inline-block whitespace-nowrap text-danger text-[11px] font-bold tracking-widest">
        {ticker}&nbsp;&nbsp;&nbsp;&nbsp;{ticker}
      </div>
    </div>
  );
}
