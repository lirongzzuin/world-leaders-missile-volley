# Progress Tracker

## Phase 1 — Game Engine Foundation ✅ COMPLETE

### Completed
- [x] Project setup (Next.js 14, TypeScript strict, Tailwind, Jest)
- [x] Central config (`gameConfig.ts`, `characters.ts`, `missileTypes.ts`, `adConfig.ts`, `infraLimits.ts`)
- [x] Full type system (`game.ts`, `socket.ts`, `api.ts`, `apps-in-toss-framework.d.ts`)
- [x] Physics engine — pure functions (`PhysicsEngine.ts`): gravity, drag, collision detection
- [x] Effect system (`EffectSystem.ts`): particle pool, screen shake, trail rendering, character/missile/net SVG renderers
- [x] Game state management (`GameState.ts`): initial state, point/set/match logic, cooldowns
- [x] AI controller (`AIController.ts`): 3 difficulties, trajectory prediction, defend/attack logic
- [x] Full canvas game loop (`GameCanvas.tsx`): input, physics, collision, effects, rendering, mobile touch controls
- [x] All 12 satirical characters with special moves (`characters.ts`)
- [x] 4 missile types with balanced physics (`missileTypes.ts`)
- [x] Apps-in-Toss SDK wrapper with mock fallback (`apps-in-toss.ts`)
- [x] Auth hook with Toss/Kakao/Google/Guest support (`useAuth.ts`)
- [x] Structured logger (`logger.ts`)
- [x] ELO calculation library (`elo.ts`)
- [x] Supabase & Upstash lazy clients with TTL helpers
- [x] UI pages: Splash/Login, Lobby (War Room), Character Select, Difficulty, Matchmaking, Game, Result, Ranking, Profile
- [x] AdBanner abstraction component
- [x] NewsTickerBar + BottomNav components
- [x] Unit tests: ELO (8 tests), Physics (9 tests), MissileConfig (8 tests)
- [x] Prisma schema (User, GameRecord)
- [x] `.env.example` with all variables documented
- [x] `docs/INFRA.md` with free tier limits and upgrade paths

### Known Issues / Phase 1 Limitations
- Character sprites use emoji/CSS shapes (no real artwork yet)
- Ranking page shows mock data (real data wired in Phase 3)
- Profile stats show 0 (real data in Phase 3)
- Online matchmaking simulates a match after 6s (real Socket.io in Phase 2)
- No actual OAuth redirect configured yet (needs .env secrets)

---

## Phase 2 — Online Multiplayer (PENDING)
- [ ] Socket.io server (`src/server/socket-server.ts`) on Fly.io
- [ ] ELO matchmaking queue (Redis-backed)
- [ ] Room creation / friend code invite
- [ ] Delta-compressed game state sync (20 Hz)
- [ ] Reconnect handling (30s grace)
- [ ] Spectator mode

## Phase 3 — Auth + Ranking (PENDING)
- [ ] Real Kakao / Google OAuth flow via NextAuth
- [ ] Toss OAuth token exchange with real Toss API
- [ ] Supabase user persistence
- [ ] ELO save after match
- [ ] Real leaderboard API with Redis cache
- [ ] Profile stats from DB

## Phase 4 — Ads + Monetization (PENDING)
- [ ] Kakao AdFit unit IDs configured
- [ ] Google AdSense unit IDs configured
- [ ] Ad timing tuned (interstitial, banner)

## Phase 5 — Polish + Deploy (PENDING)
- [ ] Real character artwork / sprites (WebP sprite sheets)
- [ ] Web Audio API sound effects (missile, explosion, BGM)
- [ ] Vercel deployment + custom domain
- [ ] Apps-in-Toss WebView optimizations (SafeArea, popstate)
- [ ] Performance: dirty rect rendering, object pooling
- [ ] Vercel Cron for 6-month game record cleanup
