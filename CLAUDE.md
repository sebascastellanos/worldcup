# Polla Mundial 2026 — Contexto para Claude Code

App de predicciones de fútbol (polla futbolera) para el Mundial 2026. Hecha para uso familiar/privado con sistema de invitaciones.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** — auth + base de datos (proyecto: `wnmllfsbwornxzwbfchj`, región: us-west-2)
- **Drizzle ORM** — solo para TypeScript types (`src/lib/db/schema.ts`). NO se usa para queries en runtime.
- **supabase-js** — toda la interacción con la BD en runtime usa `supabaseAdmin` (HTTP, no TCP directo)
- **football-data.org v4** — API de fútbol, competición ID `2000` = FIFA World Cup

## Por qué supabase-js en vez de Drizzle + postgres.js

El proyecto nuevo de Supabase usa IPv6-only para conexiones directas a Postgres. La red del desarrollador es IPv4-only → DNS no resuelve `db.wnmllfsbwornxzwbfchj.supabase.co`. Solución: usar `supabaseAdmin` que va por HTTPS.

## Estructura de carpetas

```
src/
├── app/
│   ├── (auth)/          — login, invite (rutas públicas)
│   ├── (app)/           — rutas autenticadas
│   │   ├── predictions/ — página principal (fase de grupos + acordeón)
│   │   ├── leaderboard/ — ranking
│   │   ├── dashboard/   — solo redirige a /predictions
│   │   └── admin/       — matches, invites, users (solo role=admin)
│   └── api/
│       ├── predictions/     — POST guardar, DELETE desmarcar
│       ├── admin/matches/   — PATCH actualizar resultado manual
│       ├── admin/sync/      — POST sincronizar desde football-data.org
│       └── cron/sync-results/ — GET llamado por cron (header CRON_SECRET)
├── components/app/
│   ├── groups-accordion.tsx — grid de tarjetas de grupo + panel expandible animado
│   ├── match-card.tsx       — tarjeta de partido (client component, tiene onError en img)
│   ├── prediction-form.tsx  — botones 1X2 + marcador exacto + desmarcar
│   └── sidebar.tsx          — nav lateral con logout
├── lib/
│   ├── supabase/
│   │   ├── admin.ts   — supabaseAdmin (service role key, server-only)
│   │   ├── server.ts  — createClient() para Server Components (cookies)
│   │   └── client.ts  — createClient() para Client Components (browser)
│   ├── db/
│   │   ├── schema.ts  — Drizzle schema (solo types, no queries)
│   │   ├── mappers.ts — snake_case (supabase-js) → camelCase (Drizzle types)
│   │   └── index.ts   — re-exporta schema y mappers
│   ├── sports-api/
│   │   ├── client.ts  — fetchFromSportsApi() wrapper
│   │   └── sync.ts    — syncResults() importa partidos de football-data.org
│   └── points/
│       ├── calculator.ts — calcularPuntos(pred, result): 0|1|3
│       └── updater.ts    — recalcularPuntosPartido() actualiza predictions + users
└── proxy.ts — middleware de auth (Next.js 15 lo requiere así, export named `proxy`)
```

## Tablas en Supabase

```sql
users         (id uuid PK, email, name, role: admin|participant, avatar_url, total_points, created_at)
matches       (id uuid PK, external_id unique, home_team, away_team, home_flag, away_flag, match_date, stage, status: scheduled|live|finished, home_score, away_score, updated_at)
predictions   (id uuid PK, user_id FK, match_id FK, pred_type: home_win|draw|away_win|exact_score, pred_home, pred_away, points_earned, locked, created_at, updated_at) UNIQUE(user_id, match_id)
invite_tokens (id uuid PK, token unique, created_by FK, used_by FK, used_at, expires_at, created_at)
```

## Sistema de puntos

### Fase de grupos
- Resultado correcto (1X2): **1 punto**
- Marcador exacto: **5 puntos** (si aciertas el marcador exacto)

### Fase eliminatoria
- Marcador exacto (5 pts): solo cuenta el resultado a los **90 minutos**
- Resultado 1X2 (1 pt): cuenta el resultado al **120 minutos**
  - Si hay ganador en la prórroga → home_win / away_win gana el punto
  - Si el partido va a penales → solo **draw** gana el punto (penales no cuentan)

- Se recalcula en `recalcularPuntosPartido()` al sincronizar partidos finalizados
- `users.total_points` se actualiza sumando todos los `predictions.points_earned` del usuario

### Nota sobre la API de football-data.org v4 (knockout)
Para partidos que van a penales, la API devuelve:
- `score.regularTime` → goles a los 90' ← **usar esto para home_score / away_score**
- `score.extraTime` → goles anotados EN la prórroga (no acumulado)
- `score.penalties` → goles en la tanda de penales
- `score.fullTime` → **total acumulado** (90' + ET + penales) ← NO usar para scores del partido
El sync usa `regularTime ?? fullTime` para garantizar compatibilidad con fase de grupos donde `regularTime` no existe.

## Variables de entorno (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://wnmllfsbwornxzwbfchj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...  (no se usa en runtime, solo referencia)
FOOTBALL_API_KEY=e182902b87434a41a9c6cbbc076c9aa0
FOOTBALL_API_BASE_URL=https://api.football-data.org/v4
CRON_SECRET=mi-cron-secret-2026
```

## Flujo de autenticación

- Middleware en `src/proxy.ts` (export named `proxy`, no default) — redirige a `/login` si no hay sesión
- Rutas públicas: `/login`, `/invite`
- Rutas de cron: `/api/cron/*` (validadas por header `x-cron-secret`)
- Admin: verificado en cada Server Component/route leyendo `users.role` desde `supabaseAdmin`

## Patrones de código

**Query típica server-side:**
```ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapMatch } from '@/lib/db/mappers'

const { data } = await supabaseAdmin.from('matches').select('*').eq('id', id).maybeSingle()
const match = data ? mapMatch(data) : null
```

**Mappers disponibles:** `mapMatch`, `mapUser`, `mapPrediction`, `mapInviteToken`

**Stages de partidos:**
- Fase de grupos: `GROUP_A` … `GROUP_L`
- Eliminatorias: `ROUND_OF_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `THIRD_PLACE`, `FINAL`
- El sync de la API convierte `GROUP_STAGE` + `group: "GROUP_A"` → stage `GROUP_A`

## Estado actual

- Login funciona con `sebastian.castellanos2012@gmail.com` / `Admin2026!` (role: admin)
- Partidos sincronizados: ~72 partidos reales del Mundial 2026 desde football-data.org
- La página principal es `/predictions` (dashboard redirige ahí)
- Sidebar: Predicciones, Ranking | Admin: Partidos, Invitaciones, Usuarios

## Cosas a tener en cuenta

- `match-card.tsx` debe ser `'use client'` porque usa `onError` en `<img>`
- `groups-accordion.tsx` usa animación CSS `grid-template-rows: 0fr → 1fr` (sin framer-motion, aunque está instalado)
- El middleware se llama `proxy` (no `middleware`) por requisito de Next.js 15 con la configuración actual
- No usar `db` de Drizzle para queries en runtime — siempre usar `supabaseAdmin`
