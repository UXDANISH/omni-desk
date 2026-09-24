# OmniDesk portal: backend notes

This file explains how the portal's database and sign-in work, what changed when they were added, and why. Read it before changing anything in `lib/db/`, `auth.ts` or the API routes.

For setup commands, see the [README](../README.md#quick-start).

## Contents

1. [Background](#1-background)
2. [What changed](#2-what-changed)
3. [How a request is handled](#3-how-a-request-is-handled)
4. [Database](#4-database)
5. [Sign-in and sessions](#5-sign-in-and-sessions)
6. [Running it locally](#6-running-it-locally)
7. [Decisions and why](#7-decisions-and-why)
8. [What is still sample data](#8-what-is-still-sample-data)
9. [Next step: integrations](#9-next-step-integrations)
10. [Where things live](#10-where-things-live)

---

## 1. Background

The portal started as a front-end prototype. Its API routes were real, but:

- all data lived in a JavaScript object in memory (`lib/db.ts`) and was lost on every server restart;
- sign-in accepted **any password** for a known email, and the session cookie simply held the user's id (unsigned, so anyone could edit it);
- the switch-user PIN accepted any 4 digits;
- there was no separation between practice locations.

On 2026-09-24 this was replaced in two steps:

1. **Database**: Postgres, accessed through the Drizzle ORM.
2. **Sign-in**: Auth.js v5 with real password and PIN checks.

A third step, connecting telephony, AI voice, payments, SMS and email, has not been started. See [section 9](#9-next-step-integrations).

## 2. What changed

| Area | Before | After |
|---|---|---|
| Data storage | In-memory object, reset on restart | Postgres (14 tables), survives restarts |
| Location separation | None | Every patient-facing table has a `practice_id`, and every query filters on it |
| Password | Any password accepted | bcrypt hash checked |
| Session cookie | Plain user id | Signed, encrypted Auth.js JWT, plus a database row per device |
| Signing out another device | Removed an item from a fake list | Deletes the device's session row; that device is rejected on its next request |
| Removing a teammate | Removed them from the list | Also ends all of their sessions immediately |
| Switch-user PIN | Any 4 digits | bcrypt hash checked; locks for 5 minutes after 5 wrong tries |
| Invites | Added a row, sent nothing | Creates the account plus a single-use link (7 days) to set name, password and PIN |
| Forgot password | Link did nothing | Single-use reset link (1 hour) |
| Change password / PIN | Showed a toast | Working dialogs on the profile page |
| Audit trail | In-memory list | `audit_log` table |
| Next.js | 15.1.6 | 15.5.26 (15.1.6 has CVE-2025-29927, which lets requests skip middleware) |

The screens look the same as before. The domain types in `lib/types.ts` did not change, so pages needed only small edits: they now `await` data at the top instead of reading the in-memory object.

## 3. How a request is handled

```
Browser
  │  cookies: authjs.session-token (signed JWT), cf_practice (chosen location)
  ▼
middleware.ts ──────────── edge runtime, no database access
  │  Is the JWT signature valid?  no → redirect to /login (pages) or 401 (API)
  ▼
Page or API route
  │  requireSession() in pages, guard('permission') in API routes
  ▼
lib/auth.ts  getSession()   (cached per request)
  1. Decode the Auth.js JWT → user id + session id (sid)
  2. Look up the auth_sessions row for sid   → missing = signed out
  3. Load the user                            → must be status 'Active'
  4. Load the user's practices (memberships)
  5. Pick the practice from the cf_practice cookie, if the user belongs to it;
     otherwise use their first practice
  6. At most once a minute, update last-seen times
  ▼
lib/db/index.ts   every function takes practiceId as its first argument
  ▼
Postgres
```

Two rules follow from this:

- **Middleware is not the security boundary.** It only checks that the cookie is genuine. Revocation, active status, practice access and role checks all happen in `getSession()` and `guard()`.
- **The practice id always comes from the session**, never from the request body or URL. A route cannot accidentally read another location's data if it uses `g.practiceId`.

## 4. Database

### Tables

| Table | Holds | Notes |
|---|---|---|
| `practices` | One row per location | `plan` and the AI receptionist settings (`receptionist` JSONB) are stored here |
| `users` | Team members | Email is unique regardless of case. Holds `password_hash`, `pin_hash`, PIN lockout fields and notification preferences (JSONB) |
| `memberships` | Which users can open which practices | The Owner belongs to both sample practices |
| `auth_sessions` | One row per signed-in device | Its id goes into the JWT as `sid`; deleting the row signs that device out |
| `auth_tokens` | Invite and reset links | Only a SHA-256 of the token is stored. Deleted when used |
| `patients` | Patients | Consent flags are stored as JSONB |
| `calls` | Call log, summaries, transcripts | `occurred_at` is used for ordering |
| `appointments` | Schedule | `day` is an index into the sample week (see [section 8](#8-what-is-still-sample-data)) |
| `recall_rules`, `recall_queue`, `recall_history` | Recall campaigns | |
| `deposits`, `deposit_candidates` | Payment links, and the appointments that still need one | |
| `audit_log` | Who did what | Phone reveals, refunds, role changes, sign-ins and so on |

The schema is in [lib/db/schema.ts](../lib/db/schema.ts), and the SQL migrations generated from it are in [drizzle/](../drizzle/).

### Changing the schema

1. Edit `lib/db/schema.ts`.
2. Run `npm run db:generate` to write a new SQL file in `drizzle/`. Commit it.
3. Run `npm run db:migrate` locally, and on every deploy.

Never edit a migration that has already run somewhere; add a new one.

### Adding a query

Put it in `lib/db/index.ts`. Take `practiceId` as the first argument, filter on it, and return the types from `lib/types.ts`, not raw rows. Use the existing `clean()` helper, which turns database NULLs into missing fields as the UI expects.

### Seed data

`scripts/seed.ts` loads the sample practice from `lib/mock/*`:

- **Austin** gets all the sample patients, calls, appointments, recall items and deposits.
- **Round Rock** gets its own AI settings and recall rules but no patients or calls. That is what a newly added location looks like, and it makes the separation between locations easy to check.
- Every active sample account gets the password `SEED_PASSWORD` (default `omnidesk-demo-2026`) and the PIN `SEED_PIN` (default `1234`).
- The seed refuses to run if the database already has users. `npm run db:seed -- --reset` wipes everything first, and refuses when `NODE_ENV=production`.

## 5. Sign-in and sessions

### Password sign-in

`POST /api/auth/login` validates the input, then calls Auth.js's `signIn('password')` on the server. In `auth.ts`, `authorize()`:

1. Finds the user by email (case-insensitive).
2. Checks the password with bcrypt. An unknown email is still checked against a dummy hash, so a miss takes as long as a wrong password and can't be used to find out who has an account.
3. Rejects accounts that are still `Invited`.
4. Creates an `auth_sessions` row (browser and IP) and returns its id, which Auth.js puts in the JWT.

Every failure returns the same message: "That email and password don't match an account."

Owners with several locations then see a location picker, which calls `POST /api/auth/practice`. That route only accepts a practice the user belongs to.

### Switch user (shared front-desk computers)

`POST /api/auth/switch` calls `signIn('pin')`. `authorize()` requires that:

- the request comes from a screen that is already signed in, with a valid session row;
- both the current user and the target teammate belong to the practice open on that screen;
- the target is active and not locked out.

A correct PIN ends the old device session and starts a new one for the teammate. A wrong PIN increases a counter, and 5 failures lock that teammate's PIN for 5 minutes.

### Sign-out and revocation

| Action | Effect |
|---|---|
| Sign out | Deletes this device's row and clears the cookie |
| "Sign out all others" on the profile page | Deletes every row for the user except this one |
| Change password | Signs out other devices |
| Reset password | Signs out all devices |
| Remove a teammate | Deletes their membership; if they belong to no other practice, deletes the account and all its sessions |

A copied cookie stops working as soon as its row is gone. This was tested.

### Invites and password resets

- An invite creates an `Invited` user plus a token. The link `/invite/<token>` lets the person set name, password (at least 10 characters) and PIN, then activates the account.
- "Forgot password?" on the sign-in page calls `POST /api/auth/forgot`. It always gives the same answer, whether or not the email exists. The link `/reset/<token>` works once, for 1 hour.
- **No email is sent yet.** `lib/email.ts` prints each message to the server log. In development, the invite link is also returned to the browser and copied to the clipboard; production builds never return it.

### Session length

- JWT sessions last 12 hours.
- The browser signs people out after 15 minutes without activity (`components/shell/SessionTimeout.tsx`, unchanged).

## 6. Running it locally

```bash
npm install
cp .env.example .env.local
npm run auth:secret        # paste the output into AUTH_SECRET
npm run db:local           # separate terminal; embedded Postgres saved in ./.pglite
npm run db:migrate
npm run db:seed
npm run dev
```

`db:local` uses PGlite, a Postgres build that runs inside Node. It exists because the original development machine had neither Postgres nor Docker. It is for development only. With a real Postgres, skip it and set `DATABASE_URL`.

Environment variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `DATABASE_SSL` | `1` for hosted databases that require SSL |
| `DATABASE_POOL_MAX` | Optional connection pool size (default 10) |
| `AUTH_SECRET` | Signs and encrypts session cookies. Keep it secret; changing it signs everyone out |
| `NEXT_PUBLIC_SITE_URL` | Base URL for invite and reset links, canonical URLs and the sitemap |
| `NEXT_PUBLIC_DEMO`, `NEXT_PUBLIC_DEMO_PASSWORD` | One-click demo buttons on the sign-in page. **Turn off in production**: the password ends up in the browser bundle |
| `SEED_PASSWORD`, `SEED_PIN` | Used by `db:seed` |
| `NEXT_DIST_DIR` | Optional build folder (for building while `next dev` holds `.next`) |

## 7. Decisions and why

| Decision | Why |
|---|---|
| **Drizzle** rather than Prisma | The schema is written in TypeScript next to the domain types, there is no separate engine binary, and the SQL is easy to read. |
| **JWT sessions plus an `auth_sessions` table** | Auth.js credentials sign-in only supports JWT sessions. On their own, JWTs can't be revoked, and the profile page promises "sign out other devices". The row check provides that, at the cost of one query per request. |
| **Custom `/api/auth/login`, `/switch` and `/logout` routes that call Auth.js on the server** | The existing sign-in page, location picker and switch-user dialog kept working with almost no front-end changes, and we control the error messages. |
| **Practice chosen by cookie, validated on each request** | Switching location doesn't need a new JWT, and the cookie can't grant access because membership is checked each time. |
| **Role stored on the user, not per practice** | This matches how the prototype worked. If someone needs different roles at different locations, move `role` onto `memberships`. |
| **Display text such as "Today 7:42 AM" kept as-is** | Converting the UI to real timestamps was out of scope. It should happen when telephony writes real call events. |
| **Emails printed to the log** | There is no email provider yet. All sending goes through the single `sendEmail()` function, so connecting one later changes only that file. |
| **Middleware limited to checking the cookie** | Middleware runs where database drivers aren't available. Keeping all real checks in `getSession()` avoids having two places that can disagree. |

## 8. What is still sample data

These parts still use fixed sample values or don't send anything yet:

| Part | Now | Replace with |
|---|---|---|
| Overview stats and charts, deposit 7-day totals | `lib/mock/stats.ts`, `DEPOSIT_TOTALS_7D` | Totals calculated from call and payment records |
| Calls | Seeded rows | Telephony and AI voice webhooks writing to `calls` |
| Call and appointment times | Display text (`day`, `time`) and a week index | Real timestamps |
| Recall sends, confirmation texts, call back | Database updated, nothing sent | SMS and telephony providers |
| Deposits | Rows in the database, no money moves | Payment provider (links, refunds, webhooks) |
| Billing invoices, usage, saved card | `lib/mock/team.ts` (the plan itself is stored per practice) | Payment provider |
| Email | Printed to the server log | An email provider in `lib/email.ts` |
| Two-step sign-in | The toggle is saved but not enforced | SMS codes |
| Appointments | Seeded rows | Practice-software integration (Open Dental, Dentrix, Eaglesoft, Denticon) |
| Call recordings | Placeholder player | Signed recording URLs |

## 9. Next step: integrations

Planned next: connect a telephony and AI voice provider, a payment provider, an SMS provider and an email provider, with their webhooks writing into the database. Providers have not been chosen yet. Likely candidates are Twilio or Vonage (calls and SMS), Retell or Vapi (AI voice), Stripe (payments), and Postmark or Resend (email).

When that work starts:

- Add webhook routes under `app/api/webhooks/<provider>/`. Verify each provider's signature, and add those paths to the public list in `middleware.ts`.
- Map each provider's account or phone number to a `practice_id`, for example with a new column or table.
- Write through `lib/db/index.ts`, and record changes in `audit_log` where a person or the AI acted on a patient's behalf.
- Make webhook handlers safe to receive twice: store the provider's event id and ignore repeats.

## 10. Where things live

```
auth.ts                  Auth.js: password and PIN providers, logging
auth.config.ts           Edge-safe part shared with middleware
middleware.ts            Cookie check and redirect to /login
lib/auth.ts              getSession / requireSession: the real session check
lib/api.ts               guard(permission) for API routes
lib/db/schema.ts         Tables
lib/db/client.ts         Connection pool (shared by the app and scripts)
lib/db/index.ts          Every query, always scoped to a practice
lib/password.ts          bcrypt, tokens, ids
lib/signin.ts            Server-side Auth.js sign-in that returns an error code instead of redirecting
lib/invites.ts           Create and email an invite link
lib/email.ts             Outgoing email (prints to the log for now)
lib/permissions.ts       What each role can do (unchanged)
scripts/migrate.ts       npm run db:migrate
scripts/seed.ts          npm run db:seed
drizzle/                 SQL migrations
app/api/auth/*           login, logout, switch, practice, invite, forgot, reset, and the Auth.js handler
app/api/me/password|pin  Change password / PIN
app/invite/[token]       Accept-invite page
app/reset/[token]        Reset-password page
components/shell/AuthLayout.tsx, SetPasswordForm.tsx
app/(portal)/profile/ChangeSecretDialog.tsx
```
