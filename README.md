# World Leaders Missile Volley

> 피카츄 배구에서 영감을 받은 2D 풍자 대전 게임 — 배구공 대신 미사일을 주고받습니다
> 기획 · 설계 · 개발 1인 · 2026.03 · **프로토타입** (로컬 AI 대전·로컬 2인 플레이 동작, 온라인 대전은 서버만 구현)

`TypeScript` `Next.js 14 (App Router)` `HTML5 Canvas 2D` `Socket.io` `Express` `Prisma` `Supabase Postgres` `Upstash Redis` `NextAuth` `Jest` `Vercel` `Fly.io`

> 등장 캐릭터는 각국 정상을 풍자한 패러디 캐릭터이며, 특정 정치적 입장을 지지하지 않습니다.

---

## 무엇을 만들었나

- 12명의 캐릭터 중 하나를 골라 미사일을 상대 코트에 떨어뜨리면 득점하는 배구형 대전 게임 (5점 1세트, 3세트 선승).
- 캐릭터마다 고유 필살기, 미사일 4종(속도·중력·반발 계수가 다름).
- AI 대전(3단계 난이도), 같은 기기 2인 대전, ELO 기반 온라인 랭크전(서버 측 구현).
- 토스 앱인토스(Apps-in-Toss) 미니앱 배포를 목표로 SDK 래퍼(자동 로그인·공유·친구 초대·리워드 광고·뒤로가기)를 넣고, 토스 밖에서는 mock 으로 동작하게 했습니다.

## 아키텍처

```
Next.js (Vercel)                                   Socket 서버 (Fly.io, Express + Socket.io)
 ├─ pages: 스플래시·로비·캐릭터·난이도·매칭·게임·랭킹·프로필    ├─ MatchmakingQueue  ELO 범위 매칭 (대기할수록 범위 확장)
 ├─ GameCanvas.tsx  rAF 루프 + 고정 스텝 물리 + Canvas 렌더      ├─ RoomManager       방 생성·재접속(30초 유예)·최대 방 수 제한
 ├─ src/game  (React·DOM 비의존 순수 함수)  ◀──── 같은 모듈 재사용 ─── ServerGameLoop  20Hz 틱, 틱당 물리 3스텝, 서버 권위 판정
 │    PhysicsEngine · GameState · InputProcessor · AIController · EffectSystem
 └─ API Routes                                       └─ 경기 종료 시 x-server-secret 헤더로 /api/game/complete 호출
      auth(NextAuth: 카카오·구글) · toss-auth · user/upsert
      game/complete(ELO 반영) · ranking(Redis 캐시) · profile · cron/cleanup-old-records
                     │
          Supabase Postgres (Prisma: User, GameRecord) · Upstash Redis
```

## 기술적으로 집중한 문제

### 1. 화면 주사율과 무관하게 같은 속도로 도는 물리
- **문제**: `requestAnimationFrame` 마다 물리를 한 번씩 돌리면 120Hz 화면에서는 게임이 두 배 빨라집니다.
- **해결**: 프레임 간 경과 시간을 누적하고 1/60초 단위로 물리를 여러 번 진행하는 고정 타임스텝 루프를 썼습니다. 탭 전환 후 돌아왔을 때 한꺼번에 수백 스텝이 돌지 않도록 한 프레임의 경과 시간은 100ms 로 자릅니다. 캔버스는 devicePixelRatio(최대 2)만큼 키워 고해상도 화면에서도 선명하게 그립니다 (`src/components/game/GameCanvas.tsx`).

### 2. 클라이언트와 서버가 같은 게임 규칙을 쓰도록
- **문제**: 온라인 대전에서 판정은 서버가 해야 하지만, 물리·득점 규칙을 클라이언트와 서버에 따로 짜면 결과가 어긋납니다.
- **해결**: 물리(`stepCharacter`, `stepMissile`, 원-원·원-AABB 충돌, 반사 벡터 계산)와 상태 전이(득점→세트→매치)를 DOM·React 에 의존하지 않는 순수 함수로 분리했습니다. 브라우저의 GameCanvas 와 Fly.io 의 ServerGameLoop 가 같은 모듈을 import 합니다 (`src/game/*`, `src/server/ServerGameLoop.ts`).
- **결과**: 같은 함수를 Jest 로 단위 테스트할 수 있게 되었습니다.

### 3. 숫자는 모두 설정 파일 한 곳에
- 경기 규칙(세트·점수), 아레나 크기, AI 난이도별 반응 지연·실수 확률·이동 속도, 캐릭터 능력치, 미사일 물리 계수, ELO K 계수(32)·초기값(1000), Redis TTL, 무료 인프라 한도까지 `src/config/*` 에 모아 밸런스 조정이 코드 수정 없이 가능하게 했습니다.

### 4. 무료 인프라 안에서 동작하도록
- 소켓 서버는 Fly.io 256MB 머신 1대에 `auto_stop_machines` 로 유휴 시 정지, 동시 방 수 상한(200)을 둡니다.
- 랭킹은 Upstash Redis 에 TTL 캐시, 오래된 경기 기록은 Vercel Cron(주 1회)으로 정리합니다.
- 서비스별 무료 한도와 업그레이드 기준은 `docs/INFRA.md` 에 정리했습니다.

## 현재 상태 (솔직하게)

- **동작**: AI 대전, 로컬 2인 대전, 캐릭터 선택·필살기·이펙트, 게스트 진입.
- **서버만 구현**: 소켓 서버(매칭 큐·방 관리·서버 권위 게임 루프·재접속 처리)는 있으나, 게임 화면이 서버 상태를 받아 그리는 클라이언트 측 연동은 완성되지 않았습니다.
- **미검증**: 카카오·구글·토스 로그인, DB·Redis 연동은 실제 키로 검증하지 않았습니다. 배포되어 있지 않습니다.
- 캐릭터는 이미지 에셋 없이 Canvas 도형으로 그립니다.

## 품질

- Jest 단위 테스트 37개 (ELO 계산, 물리 엔진, 미사일 설정) — `npm test` 전부 통과.
- `tsc --noEmit` (앱·소켓 서버 설정 각각) 통과, `next build` 통과.

## 실행 방법

```bash
npm install
cp .env.example .env.local      # 게임 플레이만 할 거라면 NEXTAUTH_SECRET·NEXTAUTH_URL 만 있으면 됩니다
npm run dev                     # http://localhost:3000 — 게스트로 AI 대전·로컬 2인 대전 가능

npm run server:dev              # (선택) 소켓 서버 http://localhost:3001
npx prisma migrate dev          # (선택) DB 를 연결할 때
npm test                        # 단위 테스트
```

`docker-compose.yml` 로 로컬 Postgres 를 띄울 수 있고, `Dockerfile.server` / `fly.toml` 은 소켓 서버 배포 설정입니다.

## 설정 (환경변수)

전체 목록과 설명은 `.env.example` 에 있습니다.

| 그룹 | 변수 |
|------|------|
| 인증 | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `KAKAO_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `TOSS_CLIENT_ID/SECRET` |
| 데이터 | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN` |
| 소켓 서버 | `NEXT_PUBLIC_SOCKET_SERVER_URL`, `SERVER_SECRET`, `CLIENT_ORIGIN` |
| 기타 | `CRON_SECRET`, 광고 단위 ID (`NEXT_PUBLIC_ADFIT_*`, `NEXT_PUBLIC_ADSENSE_*`) |

## 개발 방식

Claude Code 와 함께 설계·구현했습니다.
