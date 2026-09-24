# OmniDesk Portal

Web portal for **OmniDesk**, the AI receptionist for independent dental practices.
Next.js 15 (App Router) + TypeScript + Tailwind, with a Node.js API layer (Next.js Route Handlers), **Postgres** (Drizzle ORM) and **Auth.js** sign-in.

> Data lives in Postgres and sign-in is real (hashed passwords and PINs, revocable device sessions). Telephony, AI voice, payments, SMS and email are **not connected yet**: those actions update the database but nothing leaves the server (emails are printed to the server log). The seed data is fictional ("Smile Dental, Austin TX", "Dr. Sample", "Jordan Test"…).

How the database and sign-in work, what changed and why: **[docs/BACKEND.md](docs/BACKEND.md)**.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run auth:secret        # paste the output into AUTH_SECRET in .env.local
```

Point `DATABASE_URL` at any Postgres 14+ (local install, Neon, Supabase, RDS…). No Postgres on your machine? Run an embedded one in a second terminal. It keeps data in `./.pglite` and is for development only:

```bash
npm run db:local           # Postgres-compatible server on 127.0.0.1:5432 (leave it running)
```

Then create the tables, load the sample practice and start the app:

```bash
npm run db:migrate
npm run db:seed            # refuses to run on a database that already has users
npm run dev                # http://localhost:3000
```

Sample accounts (all use password `omnidesk-demo-2026` and switch-user PIN `1234`, set by `SEED_PASSWORD` / `SEED_PIN`):

| Account | Role | Sees |
|---|---|---|
| dr.sample@smiledental.example | Owner | Both locations, everything, can change roles and plan |
| pat@smiledental.example | Manager | Everything except role changes and plan changes |
| lee@smiledental.example | Front desk | No billing, no deposit dollar amounts, AI settings read-only |

`kim@smiledental.example` is an unaccepted invite and can't sign in. With `NEXT_PUBLIC_DEMO=1` the sign-in page shows one-click buttons that use `NEXT_PUBLIC_DEMO_PASSWORD`.

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `db:local`, `db:generate` (new migration after editing `lib/db/schema.ts`), `db:migrate`, `db:seed` (`-- --reset` wipes a dev database), `db:studio`, `auth:secret`.

## Database

- Schema: [lib/db/schema.ts](lib/db/schema.ts). Migrations: [drizzle/](drizzle/). All data access: [lib/db/index.ts](lib/db/index.ts).
- Every patient-facing table has a `practice_id`, and every query in `lib/db` filters on it. The practice comes from the signed-in session (`cf_practice` cookie, checked against `memberships`), never from the request body.
- The seed puts the sample data in Austin. Round Rock gets its own AI settings and recall rules but no patients or calls, which is what a newly added location looks like.
- Some display fields (`calls.day` / `time`, `appointments.day` as an index into the sample week) are stored as the UI shows them. When telephony and scheduling integrations write real events, switch these to timestamps.

## Auth

- **Auth.js v5** with two Credentials providers ([auth.ts](auth.ts)): email + password, and a 4-digit PIN for *Switch user* on shared front-desk computers. Passwords and PINs are bcrypt-hashed. PIN entry locks for 5 minutes after 5 wrong tries, and only works from an existing signed-in session in the same practice.
- Sessions are signed, encrypted JWT cookies (12 h). Each one also has a row in `auth_sessions`, checked on every request ([lib/auth.ts](lib/auth.ts)), so *Sign out other devices*, removing a teammate, changing a password and resetting a password take effect immediately.
- [middleware.ts](middleware.ts) only verifies the cookie signature at the edge. Pages and API routes do the database check and the role check.
- Invites and password resets use single-use links. Only a SHA-256 of the token is stored. Invites last 7 days, resets 1 hour. Until email is connected the link is printed in the server log (and, in development, invites copy it to the clipboard).
- Profile has *Change password* (signs out other devices) and *Change PIN* (needs the password). The two-step sign-in toggle is stored but not enforced until SMS is connected.

## Structure

```
app/
  layout.tsx              Root layout: fonts, metadata, theme cookie (no flash), skip link
  robots.ts sitemap.ts manifest.ts
  login/                  Public sign-in, forgot password, practice picker (only indexable page)
  invite/[token]/         Accept an invite: name, password, PIN
  reset/[token]/          Set a new password from a reset link
  (portal)/               Signed-in app — noindex, requires session
    layout.tsx            Shell: sidebar, mobile tab bar, session timeout, toasts
    overview/  calls/  calls/[id]/  appointments/  recall/  deposits/
    patients/  patients/[id]/  receptionist/  settings/  profile/
  api/                    Node backend (Route Handlers)
    auth/[...nextauth]  auth/login  auth/logout  auth/switch  auth/practice
    auth/invite  auth/forgot  auth/reset  me/password  me/pin
    calls  calls/[id]  calls/[id]/callback
    appointments  appointments/[id]/confirm
    recall  recall/batch  recall/rules  recall/rules/[id]
    deposits  deposits/[id]
    patients  patients/[id]  patients/[id]/consent
    receptionist  team  team/[id]  me  me/notifications  me/sessions/[id]
    billing  stats  reveal
components/
  shell/                  Sidebar, TopBar, AccountMenu, SwitchUserDialog, MobileTabBar, SessionTimeout, ThemeToggle
  ui/                     Pill, Tag, MaskedPhone, Switch, Segmented/Tabs, Nav links, Modal, Toast, Card, ActionButton, Icon, Logo
lib/
  types.ts                Domain types
  db/schema.ts            Postgres tables (Drizzle)
  db/index.ts             Data access, always scoped to a practice
  db/client.ts            Connection pool
  auth.ts                 Current user + practice for a request (Auth.js JWT + auth_sessions row)
  password.ts             bcrypt hashing, invite/reset tokens
  email.ts                Outgoing email (logs to the console until a provider is connected)
  mock/*.ts               Seed data + sample-only data (stats, invoices, usage)
  permissions.ts          Role → permission matrix (single source of truth, used by UI and API)
  queries.ts tones.ts format.ts nav.ts client.ts site.ts
auth.ts auth.config.ts    Auth.js setup (Node) and its edge-safe part
middleware.ts             Redirects signed-out users to /login
scripts/                  migrate.ts, seed.ts
drizzle/                  SQL migrations
```

## Design system

All colors come from CSS variables in `app/globals.css` (one token set, light + dark). Tailwind maps them to utilities (`bg-surface`, `text-muted`, `text-accent-tx`, …).

- Grounds: Void `#08090B`, Carbon `#14161A` (dark) / `#F6F8F9`, `#FFFFFF` (light)
- Accent: Filament `#00E5FF` on dark only. On light: `#00A8C5` for accents, `#00778A` for text/links
- Flare `#FF3B30` / `#C4281C` only for failures
- Type: **Bodoni Moda** (page titles + the one hero number), **Space Grotesk** (UI), **JetBrains Mono** (labels, times, phone numbers, IDs)
- Light theme by default; theme choice stored in a cookie so the server renders it without a flash.

## Privacy & roles

- Phone numbers are masked (`***-***-4417`). The full number is fetched from `POST /api/reveal` on click, logged to the audit trail, and re-masked after 15 s. Full numbers are stripped from list/detail API responses.
- 15-minute inactivity sign-out with a 2-minute warning (`SessionTimeout`).
- Role checks happen **on the server** (pages and API routes) via `lib/permissions.ts`, not just in the UI. Front desk can't load `/settings?tab=billing`, can't refund, and never receives deposit totals.
- Patient names are kept out of `<title>` tags (browser history / tab titles).
- No compliance badges or security claims anywhere in the UI.

## SEO

The portal holds patient information, so SEO is scoped deliberately:

- `/login` is the only public, indexable page: canonical URL, Open Graph/Twitter tags, `SoftwareApplication` JSON-LD, listed in `sitemap.xml`.
- Everything under `(portal)` sends `robots: noindex, nofollow`; `robots.txt` disallows it; API responses send `X-Robots-Tag: noindex`.
- Server-rendered pages, semantic landmarks (`header`, `nav`, `main`, `article`), one `h1` per page, `lang="en"`, `viewport`/`themeColor`, web manifest, `next/font` (no layout shift).
- Filters, tabs, date ranges and search are URL-driven (`/calls?outcome=needs&after=1`, `/overview?range=30d`) — shareable, bookmarkable, and they work before JavaScript loads.
- Set `NEXT_PUBLIC_SITE_URL` in production for correct canonical and sitemap URLs.

Marketing pages (the public site that should rank) live in the separate marketing project and are untouched.

## Still sample data / not connected

| Piece | Now | Next |
|---|---|---|
| Overview stats, charts, deposit 7-day totals | `lib/mock/stats.ts` | Compute from call and payment events |
| Calls | Seeded rows | Telephony / AI voice webhooks write `calls` |
| Deposits | Rows in Postgres, no money moves | Payment provider (links, refunds, webhooks) |
| Recall sends, confirmation texts, call back | Database updated, nothing sent | SMS + telephony providers |
| Email (invites, resets) | Printed to the server log | Email provider in `lib/email.ts` |
| Billing invoices, usage, card | `lib/mock/team.ts` (plan is stored per practice) | Payment provider |
| Appointments | Seeded rows | Practice-software integration (Open Dental, Dentrix, Eaglesoft, Denticon) |
| `AudioPlayer` | Placeholder | Signed recording URLs |

## Not built yet

- Onboarding wizard (practice details → hours → practice software → forwarding → voice → test call → go live)
- New-appointment / reschedule form (buttons show a notice)
- Real plan pricing (current `$299 / $549 / $899` are placeholders)
- Real omni logo asset (placeholder SVG ring in `components/ui/Logo.tsx`)

## Deploy

Works on any Node 18.18+ host (`npm run build && npm start`) or Vercel. Set `DATABASE_URL` (plus `DATABASE_SSL=1` if your host needs it), `AUTH_SECRET`, and `NEXT_PUBLIC_SITE_URL`, run `npm run db:migrate` on each deploy, and set `NEXT_PUBLIC_DEMO=0`. Don't run `db:seed` against production.
