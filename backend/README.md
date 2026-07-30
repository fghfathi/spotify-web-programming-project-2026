# Spotify-like — Backend (Phase 2)

Django 4.2 + Django REST Framework backend for the Phase 1 Next.js frontend.

## Stack
- Django 4.2 LTS (compatible with system Python 3.9)
- Django REST Framework + SimpleJWT (JWT auth)
- SQLite (dev) — swap the `DATABASES` block in `config/settings.py` for Postgres in prod
- Media uploads via `FileField`/`ImageField` under `media/`

## Apps
| App | Responsibility |
|-----|----------------|
| `accounts` | Custom `User` (email login, 4 roles), `ArtistProfile`, `Follow`, JWT auth |
| `catalog` | `Album`, `Song` (singles = songs without an album) + stream/download/stats |
| `playlists` | `Playlist` + ordered `PlaylistTrack` |
| `subscriptions` | `SubscriptionPlan` (DB pricing + feature matrix), `Subscription`, `Payment` |
| `streaming` | `StreamEvent` → daily-limit enforcement, play counts, stats |
| `common` | Shared DRF permission classes |

> The `support` app (tickets, payouts, audits) and full role-based access
> control arrive in step 3.3.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env            # optional; sensible defaults work for local dev

python manage.py migrate
python manage.py createsuperuser  # prompts for email + password (role=admin)
python manage.py runserver        # http://127.0.0.1:8000
```

- API root: `http://127.0.0.1:8000/api/`
- Admin panel: `http://127.0.0.1:8000/admin/`

## API (step 3.1)

All routes are slash-less. Auth is JWT: send `Authorization: Bearer <access>`.

### Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` | Create a listener `{email, password, full_name}` |
| POST | `/api/auth/login` | `{email, password}` → `{access, refresh}` |
| POST | `/api/auth/refresh` | `{refresh}` → `{access}` |

### Current user
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/me` | Own full profile |
| PATCH | `/api/me` | Edit `full_name/birthdate/gender/bio/profile_image` |
| POST | `/api/me/artist-application` | Apply to become an artist (role → artist, pending verification) |

### Catalog
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/songs`, `/api/songs/{id}` | Public. Filters: `?album=`, `?artist=` |
| POST/PATCH/DELETE | `/api/songs`… | Owner artist only. `multipart/form-data` (`audio_file`, `cover_image`) |
| GET | `/api/albums`, `/api/albums/{id}` | Public |
| POST/PATCH/DELETE | `/api/albums`… | Owner artist only |
| GET | `/api/artists`, `/api/artists/{id}` | Public directory |
| POST/DELETE | `/api/artists/{id}/follow` | Follow / unfollow (auth) |

### Playlists (auth; own only)
| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/api/playlists` | List / create (enforces playlist-count + cover limits) |
| GET/PATCH/DELETE | `/api/playlists/{id}` | Retrieve / rename / delete |
| POST | `/api/playlists/{id}/tracks` | Add `{song}` |
| DELETE | `/api/playlists/{id}/tracks/{song_id}` | Remove a track |

### Streaming & feature-gated song actions
| Method | Path | Rule enforced |
|--------|------|---------------|
| POST | `/api/songs/{id}/stream` | Daily stream limit (Basic 60/day) + early-access gate |
| GET | `/api/songs/{id}/download` | Silver/Gold only (`can_download`) |
| GET | `/api/songs/{id}/stats` | Song owner, or Gold listener (`can_view_stats`) |
| GET | `/api/artists/{id}/stats` | The artist, or Gold listener |

### Subscriptions (step 3.2)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/subscription-plans` | Public: tiers, prices, feature matrix |
| GET | `/api/subscription-plans/{tier}` | One plan (`basic`/`silver`/`gold`) |
| PATCH | `/api/subscription-plans/{tier}` | **Admin only** — change price/features (no code change) |
| POST | `/api/subscriptions/purchase` | Buy/renew `{tier: silver\|gold, months: 1\|3\|6\|12}` |
| GET | `/api/me/subscription` | Current effective tier, expiry, days remaining, features |
| GET | `/api/me/payments` | Purchase history |

**Feature matrix** (seeded by migration `subscriptions.0002_seed_plans`, prices editable):

| Tier | Daily streams | Playlists | Cover | Download | Early access | Stats | Price/mo |
|------|---------------|-----------|-------|----------|--------------|-------|----------|
| Basic  | 60        | 6         | ✗ | ✗ | ✗ | ✗ | $0 |
| Silver | unlimited | 100       | ✓ | ✓ | ✗ | ✗ | $5 (default) |
| Gold   | unlimited | unlimited | ✓ | ✓ | ✓ | ✓ | $10 (default) |

Purchase logic: renewing the same active tier **extends** the end date; switching
tier **resets** from now. `amount` is snapshotted on each `Payment`.

### Support / admin portal (step 3.3) — support staff or admin only
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/support/artist-verifications` | Application queue (`?status=pending`) |
| POST | `/api/support/artist-verifications/{id}/approve` | Verify → artist can publish |
| POST | `/api/support/artist-verifications/{id}/reject` | `{reason}` |
| GET | `/api/support/users` | Managed users (`?role=`, `?status=`) |
| POST | `/api/support/users/{id}/ban` · `/unban` | Ban sets `is_active=False` (kills JWTs) |
| POST | `/api/support/users/{id}/set-role` | **Admin only** — promote/demote support staff |
| GET | `/api/support/stats` | Platform metrics |
| GET | `/api/support/audits` | Privileged-action audit trail |

## Access control (step 3.3)

Two independent layers, both enforced server-side:

**A) Role-based** — permission classes in `apps/common/permissions.py`
(`IsListener`, `IsVerifiedArtist`/`IsVerifiedArtistOrReadOnly`, `IsSupportOrAdmin`,
`IsAdminRole`, `IsOwnerOrReadOnly`).

| Capability | listener | artist (verified) | support | admin |
|---|:---:|:---:|:---:|:---:|
| Browse catalog, stream, playlists | ✓ | ✓ | ✓ | ✓ |
| Publish/edit **own** songs & albums | ✗ | ✓ | ✗ | ✗ |
| Apply to become an artist | ✓ | — | ✗ | ✗ |
| Approve/reject artists, ban users, view stats/audits | ✗ | ✗ | ✓ | ✓ |
| Change plan pricing, assign roles | ✗ | ✗ | ✗ | ✓ |

- An artist is a `User(role=artist)` **plus** an approved `ArtistProfile`. Applying
  sets `role=artist` + a *pending* profile; only after support/admin **approval**
  can they publish. Rejected/pending artists are blocked (403) and hidden from the
  public `/api/artists` directory.
- Banned users are rejected by JWT auth (`is_active=False`) and cannot log in.

**B) Subscription-based** — feature limits from step 3.2 enforced at the API
layer (`apps/subscriptions/services.py`), never trusting the client.

## Quick test with curl

```bash
# Register + login
curl -s -X POST localhost:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@ex.com","password":"Str0ngPass!23","full_name":"Alex"}'

ACCESS=$(curl -s -X POST localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@ex.com","password":"Str0ngPass!23"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access"])')

# Authenticated profile
curl -s localhost:8000/api/me -H "Authorization: Bearer $ACCESS"

# Upload a song (after becoming a verified artist)
curl -s -X POST localhost:8000/api/songs -H "Authorization: Bearer $ACCESS" \
  -F title="Midnight" -F release_date=2026-06-12 -F duration_seconds=210 \
  -F audio_file=@/path/to/track.mp3
```

## Status
- **3.1 CRUD** ✓ · **3.2 Subscriptions + limits** ✓ · **3.3 RBAC** ✓
- Roles: support staff are created by the admin via `set-role`; the single system
  admin is a Django superuser (`createsuperuser`).

## Not yet built (future steps, not part of 3.1–3.3)
- Support **tickets** and **artist payouts / monthly rewards** (the reward formula
  is still pending). The `AuditLog` and support portal scaffolding are in place.
- **Frontend integration**: the Next.js app still reads mock data; wiring it to
  this API is the remaining connect step.
