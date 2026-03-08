# Infrastructure Guide — Free Tier Limits & Upgrade Paths

## Monthly Operating Cost: $0 (within free tiers)

---

## Vercel (Frontend + API)

| Resource | Free Limit | Alert Threshold |
|----------|-----------|-----------------|
| Serverless invocations | 100,000/month | 80,000 |
| Bandwidth | 100 GB/month | 80 GB |
| Build minutes | 6,000/month | 4,800 |
| Cron jobs | 1/day | — |

**Upgrade trigger:** >100k API calls/month → Vercel Pro ($20/month, 1M invocations, unlimited cron)

**Cost per user (estimated):** ~2 API calls per game session × 5 sessions/day × 1,000 DAU = 10,000 calls/day = 300k/month → upgrade at ~300 DAU

---

## Supabase (PostgreSQL Database)

| Resource | Free Limit | Alert Threshold |
|----------|-----------|-----------------|
| Database size | 500 MB | 400 MB |
| Egress (data transfer) | 2 GB/month | 1.6 GB |
| Concurrent connections | 60 | 45 |
| Projects | 2 | — |

**Data stored per game:** ~200 bytes (winner, loser, ELO change, character IDs)
**Capacity:** 500 MB / 200 B = 2.5 million game records

**Auto-cleanup:** Cron job deletes game records older than 6 months (configured in vercel.json)

**Upgrade trigger:** >400 MB database or >1.6 GB egress → Supabase Pro ($25/month, 8 GB DB, 50 GB egress)

---

## Upstash Redis (Cache + Matchmaking)

| Resource | Free Limit | Alert Threshold |
|----------|-----------|-----------------|
| Commands/day | 10,000 | 8,000 |
| Data size | 256 MB | 200 MB |
| Databases | 1 | — |

**TTL Policy:**
- Matchmaking queue: 5 minutes
- Ranking cache: 5 minutes
- Sessions: 30 days

**Command budget per user session:**
- Login session read: 1 cmd
- Ranking view: 1 cmd (cache hit) or 2 cmds (cache miss + write)
- Matchmaking: 3 cmds (add, scan, remove)
- Total: ~5 cmds/session

**Capacity:** 10,000 cmds/day ÷ 5 = 2,000 sessions/day

**Upgrade trigger:** >8,000 commands/day → Upstash Pay-as-you-go ($0.2 per 100k commands)

---

## Fly.io (Socket.io Server)

| Resource | Free Limit | Alert Threshold |
|----------|-----------|-----------------|
| Machine hours/month | 2,160 (shared CPU) | — |
| RAM | 256 MB | — |
| Outbound data | 100 GB/month | 80 GB |

**Memory per game room:** ~2 KB (player state, missile state, scores)
**Max rooms:** 200 rooms × 2 KB = 400 KB → well within 256 MB

**Sleep mode:** Fly.io machines auto-sleep after inactivity → $0 during off-hours

**Upgrade trigger:** Sustained >50 concurrent rooms → Fly.io Performance plan (~$10/month for dedicated CPU)

---

## Scale-Up Roadmap

| DAU | Infrastructure | Estimated Cost |
|-----|---------------|----------------|
| 0 – 300 | All free tiers | $0/month |
| 300 – 1,000 | + Vercel Pro | $20/month |
| 1,000 – 5,000 | + Supabase Pro | $45/month |
| 5,000 – 20,000 | + Upstash Pay-as-you-go + Fly.io Performance | ~$70/month |
| 20,000+ | Custom infra review | TBD |

See `UPGRADE_GUIDE.md` for step-by-step migration instructions.
