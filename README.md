# Shpotify — Phase 2

A music streaming platform: **Django REST** backend + **Next.js 16** frontend, running together
under Docker Compose.

This document covers what Phase 2 added and, most importantly, **how to use each new feature in
the website**.

---

## Quick start

### Docker (recommended)

```bash
docker compose up --build
```

Then open **http://localhost:3000**.

That single command starts PostgreSQL, applies migrations, seeds demo data, and serves both
apps. Nothing else to configure — `docker-compose.yml` has working defaults for every value.
Copy `.env.example` to `.env` only if you want to change something.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Django admin | http://localhost:8000/admin/ |

### Running locally without Docker

```bash
# backend
cd backend
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo
.venv/bin/python manage.py runserver          # :8000

# frontend (second terminal)
cd frontend
npm install
npm run dev                                    # :3000
```

With no `DATABASE_URL` set, the backend falls back to `backend/db.sqlite3`, so the local
workflow is unchanged.

---

## Demo accounts

All seeded by `python manage.py seed_demo` (idempotent, and run automatically in Docker).

| Role | Email | Password | Why it matters |
| --- | --- | --- | --- |
| Admin | `admin@shpotify.com` | `admin12345` | Sees every report, can edit subscription prices |
| Support | `support@shpotify.com` | `support12345` | Sees the support report, cannot see the admin one |
| Artist | `marlow@shpotify.com` | `artist12345` | Has 7 tracks and real stream history |
| Listener (Gold) | `listener@shpotify.com` | `listener12345` | **Alex Rivera** — Indie fan, best recommendations demo |
| Listener (free) | `free@shpotify.com` | `listener12345` | **Priya Nair** — no history, shows cold-start |
| Listener | `jazzfan@shpotify.com` | `listener12345` | Nina Solis — Jazz fan |
| Listener | `rockfan@shpotify.com` | `listener12345` | Theo Marsh — Rock fan |
| Listener | `indiefan@shpotify.com` | `listener12345` | Ada Wren — Alex's "similar listener" |

Other artists: `aviary@`, `renvale@`, `junoray@`, `nadia@` — all `artist12345`.

---

## 3.7 — Reporting

**Rule: the backend computes every number. The frontend only displays it.**

All aggregation lives in [`backend/apps/reports/services.py`](backend/apps/reports/services.py)
and uses database aggregation/annotation (`Count`, `Sum`, `Avg`, `Coalesce`, `Subquery`,
`TruncMonth`, `ExpressionWrapper`). No endpoint returns a raw list for the client to summarize.

### Endpoints

| Endpoint | Who can call it | Returns |
| --- | --- | --- |
| `GET /api/reports/admin/` | admin only | Platform totals, revenue, subscriptions, tickets, tier analytics, 6-month revenue trend, top artists/songs |
| `GET /api/reports/support/` | support + admin | Users, artists, verification queue, resolved vs unresolved tickets |
| `GET /api/reports/artist/` | artist only, self-scoped | Own streams, unique listeners, per-track revenue, genre breakdown, payouts |

A listener gets `403` on all three; an anonymous request gets `401`.

### Where to see it in the website

**As an admin** (`admin@shpotify.com`):

1. **Platform Statistics** → http://localhost:3000/support/stats
   Eight stat cards plus a ticket-resolution bar. Every figure — including
   `resolutionRatePct` — is computed by `build_support_report()`.
2. **Subscription Settings** → http://localhost:3000/support/subscriptions
   Monthly recurring revenue, paying subscribers, tier donut, ARPU, and
   month-over-month growth arrows. All from `GET /api/reports/admin/`.
   Change a plan price and press Save: the page refetches the report, and revenue
   and ARPU move — because the backend recalculated them, not the browser.

**As support staff** (`support@shpotify.com`): the same Platform Statistics page works, but
`/support/subscriptions` correctly refuses access.

**As an artist** (`marlow@shpotify.com`):

3. **Artist Panel → Overview** → http://localhost:3000/artist/dashboard
   Six summary cards and a per-track performance table. Streams, unique listeners and revenue
   all arrive precomputed.

### What actually changed

| Before | After |
| --- | --- |
| `computePlatformStats(users, artists, tickets)` counted arrays in the browser | `GET /api/reports/support/` returns the counts |
| `computeMonthlyRevenue(prices, distribution)` multiplied in the browser | Backend sums `plan__price` over active subscriptions |
| Artist dashboard `reduce()`d the track list for totals | `GET /api/reports/artist/` aggregates in SQL |
| `REVENUE_PER_STREAM = 0.004` lived in the frontend | `ARTIST_REVENUE_PER_STREAM` lives in `settings.py` and never leaves the backend |
| Charts derived their own percentages | Backend sends `sharePct` per slice |

`data/mockAnalyticsData.ts` and `data/mockSupportData.ts` were deleted outright.

Two correctness bugs were fixed by moving the math server-side:

- **Unique listeners were being double-counted.** The old dashboard summed *per-track* unique
  listeners. Someone who played two of an artist's songs counted twice. The backend now does a
  single `Count("user", distinct=True)` across the whole catalog.
- **Renewing a subscription inflated revenue.** A user who renews early briefly holds two rows
  whose date windows both contain "now", so they were counted twice in MRR and in the paying-user
  count. `_active_subscriptions()` now uses a correlated `Subquery` to keep only each user's
  latest-expiring row.

### Configuration

```bash
ARTIST_REVENUE_PER_STREAM=0.004   # artist earnings per stream, applied backend-side only
PLATFORM_CURRENCY_SYMBOL=$        # echoed back with every money figure
```

---

## 3.8 — Frontend integration

- Every core page reads from the API. `lib/api.ts` attaches the JWT, refreshes it once on a
  `401`, and retries.
- Report and recommendation calls go through [`frontend/lib/reports.ts`](frontend/lib/reports.ts),
  which is typed against [`frontend/types/reports.ts`](frontend/types/reports.ts) and
  [`frontend/types/recommendations.ts`](frontend/types/recommendations.ts). Those types mirror the
  backend response shapes field for field.
- Naming is consistent across the boundary: the API speaks camelCase, matching the TypeScript
  interfaces, so no field renaming happens in the client.
- `/api/support/stats/` is retained as a thin alias of `/api/reports/support/` so the two can
  never disagree.

### Testing

```bash
# backend — 35 tests covering report arithmetic, RBAC, and recommendation relevance
cd backend && .venv/bin/python manage.py test apps

# or against Postgres, inside the container
docker compose exec backend python manage.py test apps

# frontend
cd frontend && npx tsc --noEmit && npm run build
```

The report tests assert the numbers, not just the status codes — for example that
`resolved + unresolved == total`, that ARPU equals MRR ÷ paying users, and that a renewing
subscriber is counted once.

---

## 3.9 — Docker

```
docker compose up --build      # start everything
docker compose down            # stop
docker compose down -v         # stop and wipe the database + uploaded media
```

Three services:

- **db** — `postgres:16-alpine`, with a healthcheck the backend waits on, so it never races the
  database on a cold start.
- **backend** — gunicorn, WhiteNoise for the admin's static files, migrations and seeding on boot
  via `docker-entrypoint.sh`.
- **frontend** — Next.js `output: "standalone"`, multi-stage build.

Two details worth knowing:

- `NEXT_PUBLIC_API_BASE_URL` is inlined into the client bundle **at build time**, so it must be
  the URL the *browser* uses (`http://localhost:8000/api`), not the internal `http://backend:8000`.
- The backend runs with `DJANGO_DEBUG=0`. Django refuses to serve uploaded media in that mode, so
  `SERVE_MEDIA=1` wires the media route up explicitly. Real deployments would put nginx in front
  instead.

Set `SEED_DEMO_DATA=0` to start from an empty database.

---

## 3.10 — Song recommendation system

`GET /api/recommendations/?limit=10` — implemented in
[`backend/apps/recommendations/engine.py`](backend/apps/recommendations/engine.py).

Nothing is random. Every song gets a deterministic score from four weighted signals, each
normalized to `[0, 1]`:

```
score(song) = 0.45 · genre_affinity    share of your plays in that song's genre
            + 0.30 · collaborative     plays by listeners whose history overlaps yours,
                                       weighted by how much overlap each one has
            + 0.15 · artist_affinity   share of your plays from that artist, plus a
                                       bonus if you follow them
            + 0.10 · popularity        log-scaled global play count
```

Every returned item carries its `reason`, its `matchScore`, and the full `breakdown`, so any
suggestion can be traced back to something the listener actually did.

The engine also respects the rest of the platform: it never suggests a song you have already
played, never suggests an artist their own track, and never suggests a Gold-only early-access
track to a free listener — a recommendation the player would refuse to start is a dead end.

**Cold start.** A brand-new user has no genre or collaborative signal, which leaves followed
artists and popularity — the best available evidence — rather than a random shuffle. The response
reports `"strategy": "cold-start"` so the UI can say so honestly.

### Where to see it in the website

Sign in and open **http://localhost:3000/home**. The **"Made For You"** section is the first
thing on the feed. Each card shows the reason underneath, and the play button queues the whole
list.

Try these accounts back to back — the contrast is the demo:

| Sign in as | Section header | What you see |
| --- | --- | --- |
| `listener@shpotify.com` (Alex, Indie fan) | *Personalized* | The three Indie tracks he hasn't heard, top of the list, "Because you often listen to Indie" |
| `jazzfan@shpotify.com` (Nina) | *Personalized* | *Blue Note Rain*, the one Jazz track she hasn't played, plus songs surfaced by listeners who share her history |
| `free@shpotify.com` (Priya) | *Getting to know you* | Trending songs, "Popular on Shpotify right now" |

Play a few songs as Priya, reload `/home`, and the section switches from cold-start to
personalized.

### Verifying it isn't random

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"listener@shpotify.com","password":"listener12345"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access"])')

curl -s -H "Authorization: Bearer $TOKEN" 'http://localhost:8000/api/recommendations/?limit=5' | python3 -m json.tool
```

The seeded data is deliberately built to make the signals visible: each demo listener is a fan of
one genre and has heard only ~70% of it, so the recommender has an obvious right answer. Two Indie
fans (Alex and Ada) are given *different* slices of the Indie catalog, which is exactly the
condition collaborative filtering needs in order to say anything useful.

The test suite in [`backend/apps/recommendations/tests.py`](backend/apps/recommendations/tests.py)
locks this down. Each test isolates one signal by holding the others flat — for instance, a song
in the user's favourite genre must outrank an **equally popular** song in a genre they've never
played, and a peer's pick must outrank a *more* popular stranger's pick.

---

## Project layout

```
backend/
  apps/reports/           3.7 — aggregation services, role-gated report endpoints
  apps/recommendations/   3.10 — hybrid scoring engine
  apps/accounts|catalog|playlists|streaming|subscriptions|support|settings/
  Dockerfile, docker-entrypoint.sh
frontend/
  lib/reports.ts          typed fetchers for reports + recommendations
  types/reports.ts        report contracts
  types/recommendations.ts
  components/home/RecommendationSection.tsx
  Dockerfile
docker-compose.yml
```
