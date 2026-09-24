# OmniDesk Portal

Web portal for **OmniDesk**, the AI receptionist for independent dental practices.
Next.js 15 (App Router) + TypeScript + Tailwind, with a Node.js API layer (Next.js Route Handlers) and mock data.

> Front-end-complete prototype with a working mock backend. No real auth provider, database, telephony or payments yet. All data is fictional ("Smile Dental, Austin TX", "Dr. Sample", "Jordan Test"…).

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

With `NEXT_PUBLIC_DEMO=1`, the sign-in page shows one-click demo accounts:

| Account | Role | Sees |
|---|---|---|
| dr.sample@smiledental.example | Owner | Everything, can change roles and plan |
| pat@smiledental.example | Manager | Everything except role changes and plan changes |
| lee@smiledental.example | Front desk | No billing, no deposit dollar amounts, AI settings read-only |

Any password works. Switch-user PIN: any 4 digits.

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`.

## Structure

```
app/
  layout.tsx              Root layout: fonts, metadata, theme cookie (no flash), skip link
  robots.ts sitemap.ts manifest.ts
  login/                  Public sign-in + practice picker (only indexable page)
  (portal)/               Signed-in app — noindex, requires session
    layout.tsx            Shell: sidebar, mobile tab bar, session timeout, toasts
    overview/  calls/  calls/[id]/  appointments/  recall/  deposits/
    patients/  patients/[id]/  receptionist/  settings/  profile/
  api/                    Node backend (Route Handlers)
    auth/login  auth/logout  auth/switch
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
  mock/*.ts               Mock data (calls, appointments, patients, recall, deposits, team, receptionist, stats)
  db.ts                   In-memory store — replace with a real database
  auth.ts                 Mock cookie session — replace with an auth provider
  permissions.ts          Role → permission matrix (single source of truth, used by UI and API)
  queries.ts tones.ts format.ts nav.ts client.ts site.ts
middleware.ts             Redirects signed-out users to /login
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

## Replacing mocks

| Mock | Replace with |
|---|---|
| `lib/db.ts` in-memory store | Postgres + Prisma/Drizzle (keep the same function names) |
| `lib/auth.ts` cookie holding a user id | An auth provider with signed, encrypted sessions + real PINs |
| `api/calls/*` | Telephony/AI call service webhooks |
| `api/deposits/*` | Payment provider (payment links, refunds, webhooks) |
| `api/appointments/*` | Practice-software integration (Open Dental, Dentrix, Eaglesoft, Denticon) |
| `AudioPlayer` placeholder | Signed recording URLs |

## Not built yet

- Onboarding wizard (practice details → hours → practice software → forwarding → voice → test call → go live)
- New-appointment / reschedule form (buttons show a notice)
- Real plan pricing (current `$299 / $549 / $899` are placeholders)
- Real omni logo asset (placeholder SVG ring in `components/ui/Logo.tsx`)

## Deploy

Works on any Node 18.18+ host (`npm run build && npm start`) or Vercel. The in-memory store resets on each server restart / cold start — expected for the prototype.
