# World Leaders Missile Volley 🚀

> 전 세계 유력 정치인들을 희화화한 풍자 배구 게임. 배구공 대신 핵미사일을 주고받는다.

**⚠️ LEGAL:** All characters are satirical fictional parodies for entertainment purposes only. No affiliation with actual persons implied.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (for local Postgres + Redis)

### 1. Clone and install

```bash
git clone https://github.com/your-org/world-leaders-missile-volley
cd world-leaders-missile-volley
npm install
```

### 2. Environment setup

```bash
cp .env.example .env.local
# Edit .env.local with your keys (see comments in file)
```

### 3. Start local DB and Redis (Docker)

```bash
docker-compose up -d
```

`docker-compose.yml` starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start the dev server

```bash
npm run dev
# App runs at http://localhost:3000
```

---

## Running Tests

```bash
npm test               # Run all unit tests
npm run test:watch     # Watch mode
```

Tests cover: ELO calculation, missile physics, missile config balance.

---

## Project Structure

```
src/
├── app/               # Next.js App Router pages + API routes
├── config/            # ⭐ All game constants live here
│   ├── gameConfig.ts  # Physics, scoring, server limits
│   ├── characters.ts  # All 12 character configs
│   ├── missileTypes.ts # 4 missile type configs
│   ├── adConfig.ts    # Ad slot configuration
│   └── infraLimits.ts # Free tier limits
├── game/              # Pure game engine (no DOM/React)
│   ├── PhysicsEngine.ts
│   ├── EffectSystem.ts
│   ├── GameState.ts
│   └── AIController.ts
├── components/        # React components
├── lib/               # Utilities (auth, DB, cache, ELO)
├── hooks/             # React hooks
└── types/             # TypeScript type definitions
```

## Adding a New Character

1. Open `src/config/characters.ts`
2. Create a new `CharacterConfig` object following the interface
3. Append it to the `CHARACTERS` array
4. Done — character select, stats, and game engine auto-reflect it

## Adding a New Missile Type

1. Open `src/config/missileTypes.ts`
2. Create a new `MissileConfig` object
3. Append to `MISSILE_TYPES` array
4. Done — it can now be referenced via `missileOverride` in any special move

---

## Deployment

### Vercel (Frontend + API)
```bash
vercel deploy
```

### Fly.io (Socket.io Server — Phase 2)
```bash
fly launch --dockerfile Dockerfile.server
fly scale count 1
```

---

## Infrastructure (Monthly Cost: $0)

See `docs/INFRA.md` for full breakdown of free tier limits and upgrade triggers.

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Vercel | Frontend + API routes | 100k invocations/mo |
| Supabase | PostgreSQL database | 500 MB |
| Upstash | Redis cache + matchmaking | 10k commands/day |
| Fly.io | Socket.io server | 2,160 machine hours/mo |
