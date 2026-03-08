# World Leaders Missile Volley

**세계 지도자 핵미사일 배구** — 배구공 대신 핵미사일을 날리는, 풍자 파티 게임

> 피카츄 배구에서 영감을 받아, 전 세계 지도자들을 풍자 캐릭터로 등장시킨 실시간 2D 배구 게임입니다.
> 토스 앱인토스(Apps-in-Toss) 미니게임으로 배포를 목표로 설계되었습니다.

⚠️ **법적 고지**: 이 게임에 등장하는 모든 캐릭터는 풍자·패러디 목적의 가상 픽션 캐릭터입니다. 실제 인물이나 단체와 무관하며, 어떠한 정치적 입장도 지지하지 않습니다.

---

## 게임 소개

### 컨셉

"만약 세계 정상들이 UN 총회장에서 배구 대신 핵미사일을 주고받는다면?"

피카츄 배구의 심플한 재미를 계승하면서, 풍자와 유머를 더해 모바일에서 가볍게 즐길 수 있는 캐주얼 대전 게임입니다. 각 지도자마다 고유한 필살기(특수 미사일 조작)가 있어 캐릭터 선택에 전략적 깊이를 부여합니다.

### 핵심 플레이 루프

```
캐릭터 선택 → 난이도(AI) 또는 매칭(온라인) → 3세트 매치 → 결과 & ELO 반영 → 리매치 또는 공유
```

1. **12명의 세계 지도자** 중 하나를 골라 출전
2. **핵미사일**을 치고받으며 상대 코트에 떨어뜨리면 득점
3. **5점 1세트, 3세트 선승제**로 승부
4. 각 캐릭터 고유의 **필살기**로 전세를 뒤집기
5. 승리하면 **ELO 점수** 상승 → 세계 패권 순위에 반영

---

## 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| **프레임워크** | Next.js 14 (App Router) | SSR/SSG 하이브리드, Vercel 원클릭 배포, API Routes로 BFF 구현 |
| **게임 렌더링** | HTML5 Canvas 2D | 스프라이트 없이 순수 코드로 캐릭터를 그려 번들 사이즈 최소화. WebGL 대비 호환성 우수 |
| **상태 관리** | React useRef + 순수 함수 | 60FPS 게임 루프에서 React 리렌더링 오버헤드를 피하기 위해 ref 기반 상태 관리 |
| **스타일링** | Tailwind CSS | 유틸리티 퍼스트로 빠른 UI 구현. 다크 모드 + 밀리터리 테마 커스텀 |
| **실시간 통신** | Socket.io | 온라인 대전용 양방향 통신. 델타 압축으로 대역폭 최적화 |
| **데이터베이스** | Supabase (PostgreSQL) | 무료 티어 500MB. Prisma ORM으로 타입 안전한 쿼리 |
| **캐시** | Upstash (Redis) | 랭킹 캐시(5분 TTL), 매칭 큐, 세션 관리 |
| **인증** | 자체 구현 + Toss SDK | 토스 앱인토스 환경에서는 SDK 로그인, 그 외에는 게스트/OAuth |
| **배포** | Vercel + Fly.io | 프론트엔드는 Vercel, 소켓 서버는 Fly.io. 월 운영비 $0 |
| **언어** | TypeScript (strict) | 게임 물리 엔진부터 API까지 전체 타입 안전성 확보 |

---

## 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────┐
│                    클라이언트 (Next.js)                │
│                                                       │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │  Pages   │  │   Hooks  │  │   Game Engine        │ │
│  │ (App     │  │ useAuth  │  │ ┌─────────────────┐  │ │
│  │  Router) │  │ useSocket│  │ │ PhysicsEngine   │  │ │
│  │         │  │          │  │ │ GameState       │  │ │
│  │ lobby   │  │          │  │ │ EffectSystem    │  │ │
│  │ game    │  │          │  │ │ AIController    │  │ │
│  │ ranking │  │          │  │ │ InputProcessor  │  │ │
│  │ profile │  │          │  │ └─────────────────┘  │ │
│  └─────────┘  └──────────┘  └─────────────────────┘ │
│                       │                               │
│              ┌────────┴────────┐                     │
│              │  GameCanvas.tsx  │                     │
│              │ (Canvas 2D +    │                     │
│              │  requestAnim    │                     │
│              │  FrameLoop)     │                     │
│              └─────────────────┘                     │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Vercel   │ │ Fly.io   │ │ Supabase │
   │ API      │ │ Socket   │ │ Postgres │
   │ Routes   │ │ Server   │ │          │
   └──────────┘ └──────────┘ └──────────┘
                                  │
                            ┌─────┴─────┐
                            │  Upstash  │
                            │  Redis    │
                            └───────────┘
```

### 게임 엔진 설계

게임 엔진은 **순수 함수(Pure Function)** 기반으로 설계했습니다. DOM이나 React에 의존하지 않아 단위 테스트가 용이하고, 서버에서도 동일한 물리 엔진을 재사용할 수 있습니다.

```
GameCanvas (React 컴포넌트)
│
├── requestAnimationFrame 루프
│   ├── 입력 수집 (키보드 / 터치 / AI)
│   ├── Fixed-Timestep 물리 루프 (16.67ms 고정 간격)
│   │   ├── applyInput()      — 캐릭터에 입력 적용
│   │   ├── stepCharacter()   — 중력, 바닥 충돌, 네트 경계
│   │   ├── stepMissile()     — 탄도 물리, 벽 반사
│   │   ├── 충돌 감지          — 캐릭터↔미사일, 실드 반사, 네트, 바닥
│   │   ├── awardPoint()      — 득점 → 세트 → 매치 상태 전이
│   │   └── tickCooldowns()   — 필살기 쿨다운, 토스트, 플래시
│   │
│   └── 렌더링 (Canvas 2D)
│       ├── 배경 + 별 + 코트 + 네트
│       ├── renderCharacter()  — 12종 캐리커처 드로잉
│       ├── renderMissile()    — 미사일 + 화염 궤적
│       ├── renderEffects()    — 폭발, 스파크, 트레일 파티클
│       └── HUD 오버레이       — 점수, 세트, 카운트다운
```

**Fixed-Timestep이 중요한 이유**: 모니터 주사율(60Hz vs 120Hz)에 관계없이 물리 시뮬레이션이 동일한 속도로 동작합니다. `requestAnimationFrame`의 타임스탬프 차이를 누적하고, 16.67ms 단위로 물리를 스텝합니다. 이로써 120Hz 디스플레이에서 게임이 2배속으로 진행되는 문제를 방지합니다.

**DPR(Device Pixel Ratio) 처리**: Canvas 크기를 `window.devicePixelRatio`만큼 확대하고 CSS로 원래 크기로 축소해서, 레티나 디스플레이에서도 선명한 렌더링을 보장합니다.

### 물리 엔진 상세

| 모듈 | 역할 | 핵심 함수 |
|------|------|-----------|
| `PhysicsEngine.ts` | 순수 물리 계산 | `stepCharacter`, `stepMissile`, `computeHitVelocity`, `circlesOverlap` |
| `GameState.ts` | 상태 머신 (서브→플레이→득점→세트→매치) | `createInitialGameState`, `awardPoint`, `resetForServe` |
| `EffectSystem.ts` | 파티클 + 캐릭터 렌더링 | `renderCharacter`, `renderMissile`, `createExplosionParticles` |
| `AIController.ts` | 난이도별 AI 로직 | `computeAIInput`, `predictMissileY` |

**충돌 감지 체계**:
- 캐릭터↔미사일: Circle-Circle 충돌 → `computeHitVelocity`로 반사 벡터 계산 (항상 상대 코트 방향)
- 미사일↔네트: Circle-AABB 충돌 → 폭발 이펙트 + 서브 리셋
- 미사일↔바닥: Y좌표 비교 → 득점 처리 + 스크린 셰이크
- 미사일↔벽/천장: 탄성 반사 (restitution 계수 적용)
- 실드↔미사일: 거리 계산 → 미사일 역반사 + 스파크

### AI 난이도 시스템

AI는 탄도 예측(`predictMissileY`)을 기반으로 이동하되, 난이도에 따라 의도적인 제약을 둡니다:

| 난이도 | 반응 지연 | 의도적 미스율 | 필살기 사용 확률 | 이동 속도 배율 |
|--------|-----------|--------------|-----------------|---------------|
| 평화협상 (Easy) | 30프레임 | 30% | 5% | 0.6x |
| 냉전 (Normal) | 10프레임 | 5% | 20% | 0.85x |
| 핵전쟁 (Hard) | 2프레임 | 1% | 50% | 1.0x |

---

## 캐릭터 시스템

12명의 세계 지도자를 4가지 타입으로 분류하고, 각각 고유한 스탯과 필살기를 부여했습니다.

### 타입 분류

| 타입 | 특징 | 대표 캐릭터 |
|------|------|------------|
| **파워** | 높은 타격력, 느린 이동 | Trump, Kim, Lee |
| **스피드** | 빠른 이동, 높은 점프 | Putin, Zelensky, Meloni |
| **기술** | 특이한 미사일 궤적 | Macron, Modi |
| **수비** | 실드/요격 능력 | Khamenei, Scholz |
| **균형** | 올라운드 스탯 | Xi, Ishiba |

### 전체 캐릭터 목록

| 캐릭터 | 국가 | 타입 | 필살기 | 효과 |
|--------|------|------|--------|------|
| 🇺🇸 D. TRUMP | USA | 파워 | Tariff Launcher | 미사일 가속 + "WRONG!" 토스트 |
| 🇮🇷 KHAMENEI | Iran | 수비 | Martyr Volley | 극초음속 수직 발사 |
| 🇨🇳 XI JINPING | China | 균형 | Iron Curtain | 3초간 반사 실드 활성화 |
| 🇷🇺 V. PUTIN | Russia | 스피드 | Kinzhal Dash | 극초음속 변환 + 2배속 |
| 🇰🇵 KIM JONG-UN | N. Korea | 파워 | Juche Rocket | ICBM 변환, 폭발 반경 3배 |
| 🇫🇷 MACRON | France | 기술 | Diplomatic Spin | 역회전 백스핀 |
| 🇩🇪 O. SCHOLZ | Germany | 수비 | Patriot Shield | 미사일 역반사 요격 |
| 🇺🇦 ZELENSKY | Ukraine | 스피드 | Himars Dive | 1.5배속 리턴 |
| 🇯🇵 S. ISHIBA | Japan | 균형 | Tomahawk Lob | 순항미사일 저공 직선 |
| 🇰🇷 이재명 | S. Korea | 파워 | 현무 스매시 | 2배속 + 급강하 스파이크 |
| 🇮🇳 N. MODI | India | 기술 | Agni Curve | 저중력 커브 궤적 |
| 🇮🇹 G. MELONI | Italy | 스피드 | Cannone Romano | 최고속 직선 포격 |

### 캐릭터 렌더링

스프라이트 이미지 없이 Canvas 2D API로 직접 캐리커처를 그립니다. 공유 헬퍼 함수(`drawHead`, `drawSuitBody`, `drawHair`, `drawEyes` 등)를 조합해 12종의 고유한 외형을 구현합니다.

```
좌표 체계: (x, y) = 캐릭터 발 위치
├── 머리 중심: (x, y-80), 반지름 26px
├── 몸통: y-65 ~ y (정장/군복/쿠르타 등)
├── 이름표: y-122 위치
└── 그림자: y+2 위치 타원
```

캐릭터별 고유 요소:
- **Trump**: 금색 폼파두르 헤어 + 빨간 넥타이 + 주황색 피부
- **Kim**: 통통한 뺨 + 이중턱 + 넓은 마오쩌둥 재킷
- **Zelensky**: 올리브색 군복 + Z 로고 + 수염
- **Modi**: 사프란 쿠르타 + 흰 수염 + 양옆 흰 머리
- **Lee**: 파란 정장 + 태극 뱃지

---

## 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 스플래시/로그인 | 나이 확인, 닉네임 입력, 토스/카카오/구글/게스트 로그인 |
| `/lobby` | 작전실 (로비) | 유저 정보, ELO 티어, 뉴스 티커, 게임 모드 선택 (4종) |
| `/character-select` | 캐릭터 선택 | 12종 캐러셀, 스탯 바, 필살기 정보, 타입 뱃지 |
| `/difficulty` | AI 난이도 | 평화협상/냉전/핵전쟁 3단계, 랜덤 AI 상대 배정 |
| `/matchmaking` | 매칭 대기 | Socket.io 큐, 실시간 타이머, 핑 표시 |
| `/game/[roomId]` | 게임 플레이 | 전체화면 Canvas 게임 + 결과 화면 (ELO 변동, 공유) |
| `/ranking` | 세계 패권 순위 | 전체/주간/월간 탭, 상위 50명, 티어 색상 |
| `/profile` | 전투 기록부 | ELO 추이 차트, 최근 전적, 통계 (승률/연승) |
| `/settings` | 설정 | 효과음/진동 토글, 앱 정보, 로그아웃 |

### 게임 플레이 흐름

```
[카운트다운 3,2,1] → [서브 대기] → [랠리] → [득점] → [서브 리셋]
                                                          ↓
                                              [5점 도달 → 세트 종료]
                                                          ↓
                                              [3세트 선승 → 매치 종료]
                                                          ↓
                                              [결과 화면 → 리매치/로비]
```

---

## ELO 랭킹 시스템

체스에서 사용되는 ELO 레이팅을 게임에 적용했습니다.

**계산 공식**:
```
예상 승률 = 1 / (1 + 10^((상대ELO - 내ELO) / 400))
ELO 변동 = K × (실제결과 - 예상승률)    (K = 32)
```

**티어 구간**:

| 티어 | ELO | 색상 |
|------|-----|------|
| 세계정상 | 2500+ | 골드 |
| Diamond | 2000+ | 시안 |
| Platinum | 1700+ | 에메랄드 |
| Gold | 1400+ | 옐로 |
| Silver | 1200+ | 그레이 |
| Bronze | 0+ | 브론즈 |

---

## 미사일 타입

| 타입 | 중력 | 항력 | 탄성 | 속도 배율 | 특징 |
|------|------|------|------|-----------|------|
| Standard (ICBM) | 0.35 | 0.002 | 0.7 | 1.0 | 표준 포물선 |
| Hypersonic | 0.15 | 0.001 | 0.5 | 1.8 | 빠르고 평평한 궤적 |
| Cruise | 0.25 | 0.01 | 0.85 | 0.7 | 느리지만 예측 불가 |
| ICBM MAX | 0.5 | 0.003 | 0.6 | 0.8 | 높은 포물선, 대형 폭발 |

필살기가 미사일 타입을 변경하는 구조(`missileOverride`)로, 캐릭터별 전략 차별화를 구현합니다.

---

## Apps-in-Toss 연동

토스 앱인토스 SDK를 래핑하여 실제 토스 환경과 개발 환경을 자동으로 구분합니다.

```typescript
// 실제 토스 앱 내부인지 자동 감지
export function isTossApp(): boolean {
  return typeof window !== 'undefined' && !!window.__APPS_IN_TOSS__;
}
```

| 기능 | 토스 앱 내부 | 일반 브라우저 |
|------|-------------|-------------|
| 로그인 | `appLogin()` → OAuth 교환 | 게스트 로그인 |
| 공유 | `share({ message })` | `navigator.share` fallback |
| 결제 (추후) | `createOneTimePurchaseOrder` | 미지원 |

SDK 패키지(`@apps-in-toss/web-framework`)는 설치하지 않고, 토스 앱이 런타임에 주입합니다. `next.config.mjs`에서 webpack external로 처리하고, 타입 심(shim)으로 TypeScript 호환성을 확보합니다.

---

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 스플래시/로그인
│   ├── lobby/              # 로비 (메인 허브)
│   ├── character-select/   # 캐릭터 선택
│   ├── difficulty/         # AI 난이도 선택
│   ├── game/[roomId]/      # 게임 플레이 + 결과
│   ├── matchmaking/        # 온라인 매칭 대기
│   ├── ranking/            # 세계 패권 순위
│   ├── profile/            # 전투 기록부
│   ├── settings/           # 설정
│   ├── layout.tsx          # 루트 레이아웃 (다크테마, 430px 모바일)
│   └── api/                # API Routes (BFF)
│       ├── toss-auth/      # 토스 OAuth 교환
│       ├── user/upsert/    # 유저 생성/업데이트
│       ├── ranking/        # 랭킹 조회 (Redis 캐시)
│       ├── profile/[userId]/ # 프로필 + 전적 조회
│       ├── game/complete/  # 게임 결과 기록 (서버 전용)
│       └── cron/           # 90일 이전 기록 정리
│
├── game/                   # 순수 게임 엔진 (React/DOM 무의존)
│   ├── PhysicsEngine.ts    # 중력, 충돌, 반사 물리
│   ├── GameState.ts        # 상태 머신 + 점수 로직
│   ├── EffectSystem.ts     # 파티클 + 캐릭터 렌더링
│   ├── AIController.ts     # 난이도별 AI 행동
│   └── InputProcessor.ts   # 입력 → 캐릭터 상태 변환
│
├── config/                 # 모든 게임 상수 (하드코딩 제로)
│   ├── gameConfig.ts       # 물리, 점수, 서버 상수
│   ├── characters.ts       # 12캐릭터 설정 + 필살기 로직
│   ├── missileTypes.ts     # 4종 미사일 물리 설정
│   ├── adConfig.ts         # 광고 슬롯 설정
│   └── infraLimits.ts      # 인프라 무료 티어 한도
│
├── components/
│   ├── game/GameCanvas.tsx  # 메인 게임 컴포넌트 (Canvas + 루프)
│   ├── ui/BottomNav.tsx     # 하단 네비게이션
│   ├── ui/NewsTickerBar.tsx # 풍자 뉴스 마퀴
│   └── ads/AdBanner.tsx     # 광고 추상화 (AdFit/AdSense)
│
├── hooks/
│   ├── useAuth.ts           # 인증 (토스/게스트/OAuth)
│   └── useSocket.ts         # Socket.io 연결 관리
│
├── lib/
│   ├── elo.ts               # ELO 계산 + 티어 판정
│   ├── apps-in-toss.ts      # 토스 SDK 래퍼 + 모킹
│   ├── db.ts                # Prisma 싱글턴
│   ├── supabase.ts          # Supabase 클라이언트
│   ├── upstash.ts           # Redis 캐시 헬퍼
│   └── logger.ts            # 구조화된 로깅
│
├── types/
│   ├── game.ts              # 게임 핵심 타입 (State, Config, Physics)
│   ├── api.ts               # API 요청/응답 타입
│   ├── socket.ts            # Socket.io 이벤트 타입
│   └── apps-in-toss-framework.d.ts  # 토스 SDK 타입 심
│
└── server/                  # Socket.io 서버 (별도 빌드)
```

---

## 로컬 개발

### 필요 환경
- Node.js 18+
- npm

### 설치 및 실행

```bash
git clone https://github.com/lirongzzuin/world-leaders-missile-volley.git
cd world-leaders-missile-volley
npm install
```

```bash
cp .env.example .env.local
# .env.local에 필요한 키 설정 (없어도 게스트 모드로 동작)
```

```bash
npm run dev
# http://localhost:3000 에서 실행
```

### 데이터베이스 (선택)

온라인 기능(랭킹, 프로필)을 사용하려면 Supabase + Upstash 설정이 필요합니다.
AI 대전과 로컬 대전은 DB 없이도 완전히 동작합니다.

```bash
# Prisma 마이그레이션 (DB 사용 시)
npx prisma migrate dev --name init
```

### 빌드

```bash
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
```

### 테스트

```bash
npm test              # 단위 테스트
npm run test:watch    # 워치 모드
```

---

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 선택 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 선택 | Supabase anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | Supabase 서버 전용 키 |
| `UPSTASH_REDIS_REST_URL` | 선택 | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | 선택 | Upstash Redis 토큰 |
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | 선택 | Socket.io 서버 URL |
| `TOSS_CLIENT_ID` | 선택 | 토스 OAuth 클라이언트 ID |
| `TOSS_CLIENT_SECRET` | 선택 | 토스 OAuth 시크릿 |
| `KAKAO_CLIENT_ID` | 선택 | 카카오 로그인 |
| `GOOGLE_CLIENT_ID` | 선택 | 구글 로그인 |
| `SERVER_SECRET` | 선택 | 서버간 통신 시크릿 |
| `CRON_SECRET` | 선택 | Vercel 크론 시크릿 |

> **참고**: 모든 환경 변수가 없어도 게스트 로그인 + AI 대전은 정상 동작합니다.

---

## 배포

### Vercel (프론트엔드 + API)

```bash
vercel deploy
```

### Fly.io (Socket.io 서버)

```bash
fly launch --dockerfile Dockerfile.server
fly scale count 1
```

### 인프라 비용: 월 $0

| 서비스 | 역할 | 무료 티어 |
|--------|------|-----------|
| Vercel | 프론트엔드 + API | 100k 호출/월 |
| Supabase | PostgreSQL DB | 500MB 스토리지 |
| Upstash | Redis 캐시 + 매칭 큐 | 10k 커맨드/일 |
| Fly.io | Socket.io 서버 | 2,160 머신시간/월 |

---

## 설계 원칙

1. **순수 함수 우선**: 게임 엔진의 모든 상태 전이는 입력을 받아 새 상태를 반환하는 순수 함수. 사이드 이펙트 없음, 테스트 용이
2. **설정 중앙화**: 모든 게임플레이 수치는 `config/` 디렉토리에 집중. 게임 로직에 매직 넘버 제로
3. **점진적 기능 해제**: DB 없이도 AI 대전 동작, 소켓 서버 없이도 로컬 대전 동작
4. **모바일 퍼스트**: 430px 최대 너비, 터치 조이스틱 + 점프/필살기 버튼, 전체화면 가로 모드 게임
5. **프레임 독립 물리**: Fixed-timestep 루프로 모든 디바이스에서 동일한 게임 경험
6. **제로 에셋**: 이미지/스프라이트 없이 Canvas API로 모든 비주얼 구현. 번들 사이즈 최소화

---

## 향후 계획

- [ ] 온라인 2v2 동맹전 모드 구현
- [ ] 사운드 엔진 (효과음 + 배경음)
- [ ] 신규 캐릭터 추가 (시즌별)
- [ ] 토스 앱인토스 정식 배포
- [ ] 리플레이 시스템
- [ ] 관전 모드

---

## 라이선스

이 프로젝트는 개인 프로젝트입니다. 모든 캐릭터는 풍자·패러디 목적의 가상 픽션이며, 실제 인물이나 단체와 무관합니다.
