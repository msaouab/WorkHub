# WorkHub Backlog

The single list of planned work, bugs and tech debt, **ordered by priority** (most important first).
Update it in the same commit as the work: move tickets between sections, tick acceptance criteria, add new findings.

_Last updated: 2026-10-11_

## How to use this file

**Ticket ID:** `WH-###`, never reused. New tickets take the next free number, whatever their priority.

**Priority** decides the order inside each section:

| Priority | Meaning |
|---|---|
| **P0** | Broken or insecure. Fix before anything else |
| **P1** | Next up. Needed for the current milestone |
| **P2** | Planned. Needed later in the roadmap |
| **P3** | Nice to have, cleanup, or blocked on a decision |

**Type:** `feature` · `bug` · `security` · `tech-debt` · `chore`

**Status:** `in progress` · `ready` (fully defined, can start) · `blocked` (waits on another ticket) · `later` (not defined in detail yet) · `done`

**Ticket format:** every ticket says **why** it exists, **what** is in scope, and **acceptance criteria**: checks that prove it is done.

**Roadmap (from the plan we agreed):** one feature at a time, backend and frontend together:
1. Login UI + frontend foundation (translations, RTL, hooks). **Current milestone**
2. Workspaces, roles, memberships (+ per-workspace data isolation)
3. Invites (email and link, expiry, default role)
4. Permissions management
5. OAuth sign-in (Google, GitHub, Microsoft, GitLab)

---

## In progress

### WH-001 · Finish moving the web app to language URLs (`/en`, `/fr`, `/ar`)
- **Type:** feature · **Priority:** P1 · **Status:** in progress · **Area:** client
- **Why:** NFR-10 requires EN and AR at launch (FR later), with full right-to-left layout for Arabic. Every later page builds on this, so it must be finished first.
- **Scope:**
  - All pages live under `apps/client/src/app/[locale]/`.
  - Text comes from `src/messages/{en,fr,ar}.json` through next-intl.
  - `<html lang dir>` follows the language: `rtl` for `ar`, using `RTL_LOCALES` from `@work-hub/constants`.
  - The language list comes from the shared `LOCALES`, never a separate list.
- **Acceptance criteria:**
  - [ ] Every page (`/`, `/contact`, `/sign-in`, `/sign-up`, `/verify-email`, `/forgot-password`, `/reset-password`, `/app`) loads under `/en`, `/fr` and `/ar` with no 404.
  - [ ] Visiting a page without a language (e.g. `/sign-in`) redirects to the default language (`/en/sign-in`).
  - [ ] `/ar/...` renders with `dir="rtl"`, and the layout is mirrored.
  - [ ] No English text left hard-coded in components; every string is in the 3 message files.
  - [ ] All 3 message files have the same keys (a test checks this).
  - [ ] Confirm the Next.js 16 file name for the middleware: `middleware.ts` or the newer `proxy.ts`.
  - [ ] `pnpm nx run-many -t typecheck lint test --projects=@work-hub/client` is green.
- **Notes:** the `nx sync` reference to `libs/shared/contracts` in `apps/client/tsconfig.json` must be committed with this work, or `pnpm dev` refuses to start.

---

## Ready (next up, in order)

### WH-002 · Bug: unverified users hit a dead end on sign-in
- **Type:** bug · **Priority:** P1 · **Status:** ready · **Area:** client
- **Why:** a user who signs in before verifying their email only sees "Email not verified", with no way to get a new link. A redirect fixing this was added, then lost when the sign-in form was rewritten for translations (WH-001).
- **Scope:** in `sign-in-form.tsx`, when the error code is `EMAIL_NOT_VERIFIED`, redirect to `/{locale}/verify-email?email=…`. The "Resend" button already exists there.
- **Acceptance criteria:**
  - [ ] Signing in as `unverified@workhub.test` / `workhub-dev-1` lands on the verify-email page, with the email filled in.
  - [ ] "Resend" sends a new email (visible in Mailpit).
  - [ ] The redirect keeps the current language (`/ar/...` stays Arabic).
- **Depends on:** WH-001 (localized URLs).

### WH-003 · Security: sign-out keeps the previous user's data in the browser cache
- **Type:** security · **Priority:** P1 · **Status:** ready · **Area:** client
- **Why:** `AppHome` and `AuthNav` call `authClient.signOut()` but never clear TanStack Query's cache. If user A signs out and user B signs in on the same browser, B can briefly see A's cached `/me` data.
- **Scope:** sign-out calls `queryClient.clear()` after `authClient.signOut()`. Done once, inside `useAuth()` (WH-004), and used everywhere.
- **Acceptance criteria:**
  - [ ] Sign in as `member@workhub.test`, open `/app`, sign out, then sign in as `admin@workhub.test`: the page never shows Mia's data, not even for a moment.
  - [ ] There is only one sign-out implementation in the client (no copies in components).
- **Depends on:** WH-004.

### WH-004 · Hooks foundation: `queryKeys`, `useAuth`, `useRequireAuth`
- **Type:** tech-debt · **Priority:** P1 · **Status:** ready · **Area:** client
- **Why:** session logic is copied into `AppHome` and `AuthNav`, and each future page would copy it again. Cache keys written by hand (`['me']`) lead to "screen didn't update" bugs when a typo appears.
- **Scope:**
  - **`src/lib/api/query-keys.ts`:** every TanStack Query key in one object, e.g. `queryKeys.me`, `queryKeys.spaces.detail(slug)`. All hooks use it; no raw key arrays anywhere.
  - **`src/hooks/use-auth.ts` → `useAuth()`:** returns `{ user, isSignedIn, isPending, signOut }`. `signOut` signs out **and** clears the query cache (fixes WH-003).
  - **`src/hooks/use-require-auth.ts` → `useRequireAuth()`:** for signed-in pages. Redirects to `/{locale}/sign-in` when there's no session; returns the same values as `useAuth`. This is a user-experience guard only: the API still rejects every request without a session.
  - Replace the duplicated logic in `AppHome` (its `useEffect` redirect) and `AuthNav` with these hooks. Update `useMe` to use `queryKeys.me`.
- **Acceptance criteria:**
  - [ ] `AppHome` and `AuthNav` contain no direct `authClient.useSession()` or `authClient.signOut()` calls.
  - [ ] Opening `/en/app` while signed out redirects to `/en/sign-in`; while signed in, it shows the user.
  - [ ] No raw query-key arrays remain in the client (`grep "queryKey: \['"` finds nothing).
  - [ ] Unit tests for `useAuth` (sign-out clears the cache) and `useRequireAuth` (redirects when signed out).
- **Depends on:** WH-001 (redirect target is a localized URL).

### WH-005 · Language switcher: `useUpdateMe`, `useLocaleSwitcher`, `useDirection`
- **Type:** feature · **Priority:** P1 · **Status:** ready · **Area:** client
- **Why:** users must be able to change their language. The API already supports it (`PATCH /api/v1/me`), but the web app has no way to do it.
- **Scope:**
  - **`useUpdateMe()`:** TanStack Query mutation that calls `updateMe()` from `lib/api/me.ts`. On success it writes the returned user into the `queryKeys.me` cache, so no refetch is needed.
  - **`useLocaleSwitcher()`:** `switchLocale(locale)` does two things:
    1. changes the URL language (next-intl router, same page);
    2. if signed in, saves the choice with `useUpdateMe`.
    Signed-out visitors only get the URL change.
  - **`useDirection()`:** returns `'rtl'` or `'ltr'` for the current language, from `RTL_LOCALES`. For client components that must flip things (icons, arrows). The server `layout.tsx` uses `RTL_LOCALES` directly.
  - A language selector in the header and on `/app`, showing `English` / `Français` / `العربية`.
- **Acceptance criteria:**
  - [ ] Switching to Arabic on `/en/app` moves to `/ar/app`, mirrors the layout, and `GET /api/v1/me` then returns `"locale":"ar"`.
  - [ ] After sign-out and sign-in again, the app opens in the saved language.
  - [ ] Signed-out visitors can switch language; no API call is made.
  - [ ] A failed save shows an error message and does not break the page.
- **Depends on:** WH-001, WH-004.

### WH-006 · Browser test of every auth flow after the language move
- **Type:** chore · **Priority:** P1 · **Status:** ready · **Area:** client + api
- **Why:** sign-up, verify, forgot and reset password have only been tested with curl, or not at all, since the web pages changed.
- **Scope:** manual browser pass, then one automated Playwright test in `apps/client-e2e`.
- **Acceptance criteria:**
  - [ ] Manual, in `en` and `ar`: sign up → email in Mailpit → link signs in → `/app` shows the user → sign out.
  - [ ] Manual: forgot password → email → reset page → new password works, old one fails.
  - [ ] Playwright test: sign up a new `@workhub.test` user, read the verification link from the Mailpit API (`GET localhost:8025/api/v1/message/latest`), open it, and assert `/app` shows the user's name.
  - [ ] The Playwright test cleans up after itself (or the suite runs `pnpm db:seed -- --reset` first).
- **Depends on:** WH-001, WH-002.

### WH-007 · Forms: switch the auth forms to React Hook Form + Zod
- **Type:** tech-debt · **Priority:** P2 · **Status:** ready · **Area:** client
- **Why:** the 5 auth forms each repeat the same `useState` for values, error and pending state. The SRS chooses React Hook Form + Zod for forms, and the schemas already exist (`src/lib/validators/auth.ts`).
- **Scope:** use `react-hook-form` with `@hookform/resolvers/zod` in sign-in, sign-up, forgot-password, reset-password and contact. Show errors next to each field instead of one message at the bottom.
- **Acceptance criteria:**
  - [ ] No form component keeps its own `useState` for field values.
  - [ ] Each invalid field shows its own translated message.
  - [ ] Submit is disabled while sending, as today.
- **Depends on:** WH-001 (messages must be translated).

### WH-008 · Bug: the sign-in "Email verified" banner never appears
- **Type:** bug · **Priority:** P3 · **Status:** ready · **Area:** client
- **Why:** `sign-in-form.tsx` shows a banner when the URL has `?verified=1`, but nothing links there. The verification email sends users to `/app`, already signed in.
- **Scope:** decide one of two options:
  - (a) remove the banner and its message keys;
  - (b) show a one-time "Email verified" notice on `/app` instead (e.g. `callbackURL` → `/{locale}/app?verified=1`).
- **Acceptance criteria:**
  - [ ] No dead code path: either the banner is gone, or it appears after verifying.

---

## Later: roadmap features (defined at a high level, detailed when they become next)

### WH-009 · Workspaces, roles and memberships (backend + UI)
- **Type:** feature · **Priority:** P1 (next milestone) · **Status:** later · **Area:** api + client + database
- **Why:** the core of the product. Users create workspaces, and every piece of business data belongs to exactly one workspace (SRS: "space").
- **Scope (to split into smaller tickets when started):**
  - **Database:** `spaces`, `roles` (permission lists), `memberships` (user × space × role) and a default role per workspace. Plus **row-level security**, so a query can only ever see one workspace's rows, with the API connecting as the restricted `workhub_app` role.
  - **API:**
    - `POST /api/v1/spaces`: creating a workspace makes you its owner;
    - `GET /api/v1/me/spaces`;
    - a workspace guard on `/api/v1/spaces/{spaceId}/…` that loads your role **fresh on every request**, never from the session.
  - **Seed:** an "Acme" workspace, with `owner@`, `admin@` and `member@workhub.test` as its owner, admin and member.
  - **UI:** create-workspace page, workspace switcher, pages under `/{locale}/s/{slug}/…`, member list.
  - **Hooks:** WH-014, WH-015.
- **Decided design:** workspace in the URL, never in the session. Role checked per request. `lastWorkspaceId` on the user only to choose where to land after sign-in.
- **Acceptance (high level):** a user in workspace A can never read or change workspace B's data. An integration test proves it.

### WH-010 · Invites by email and by link
- **Type:** feature · **Priority:** P2 · **Status:** later · **Area:** api + client
- **Why:** your original requirement. Join a workspace only by invite (email or link); invites expire; new members get the workspace's default role.
- **Scope:**
  - email invites: single use, tied to one email address, 7 days;
  - invite links: maximum number of uses, expiry, can be revoked;
  - only a hash of each token is stored;
  - accept flow `/{locale}/invite/{token}` (sign in or sign up first, then join);
  - hooks WH-016, WH-017, WH-018.
- **Depends on:** WH-009.

### WH-011 · Permissions management
- **Type:** feature · **Priority:** P2 · **Status:** later · **Area:** api + client
- **Why:** your original requirement. Workspace admins set what each member can do and can change anyone's role.
- **Scope:**
  - change a member's role;
  - custom roles;
  - safety rules (you can't give permissions you don't have, can't change your own role, the owner role is locked);
  - UI: members and roles settings;
  - hook WH-019.
- **Depends on:** WH-009.

### WH-012 · Sign in with Google, GitHub, Microsoft and GitLab
- **Type:** feature · **Priority:** P2 · **Status:** later · **Area:** api + client
- **Why:** your original requirement.
- **Scope:**
  - configure the 4 providers in `createAuth`;
  - re-enable `/sign-in/social`, `/link-social` and `/unlink-account` in `DISABLED_PATHS`;
  - "Continue with …" buttons;
  - account-linking rules: only link automatically when the provider confirms the email is verified, so never automatically for Microsoft;
  - "My sign-in methods" in settings.
- **Depends on:** WH-001.

### WH-013 · Emails in the user's language
- **Type:** feature · **Priority:** P2 · **Status:** later · **Area:** api
- **Why:** verification and reset emails are English only, even for Arabic users (NFR-10).
- **Scope:** `MailService` templates per locale (`en`, `fr`, `ar`, with RTL in the HTML for Arabic). The user's `locale` picks the template.

## Later: hooks planned with those features
Each is built together with its feature ticket. The rules for all hooks:
- HTTP calls live in `src/lib/api/*`; hooks only connect them to TanStack Query;
- every hook uses `queryKeys`;
- hooks hide UI only, the API enforces.

### WH-014 · `useSpaces()`: my workspaces
- **Type:** feature · **Priority:** P2 · **Status:** blocked (WH-009) · **Area:** client
- **What:** list of the current user's workspaces (`GET /api/v1/me/spaces`), for the workspace switcher and "pick a workspace" page. Key `queryKeys.spaces.all`.
- **Done when:** creating a workspace adds it to the switcher without a page reload (cache invalidated).

### WH-015 · `useSpace(slug)` / `useCurrentSpace()`: the workspace in the URL
- **Type:** feature · **Priority:** P2 · **Status:** blocked (WH-009) · **Area:** client
- **What:**
  - `useSpace(slug)` loads one workspace (`queryKeys.spaces.detail(slug)`);
  - `useCurrentSpace()` reads the slug from the `/s/{slug}` URL and calls `useSpace`.
- **Done when:** two browser tabs on two different workspaces each show the right data; a slug you're not a member of shows a "no access" page.

### WH-016 · `useMembers(spaceId)`: members of a workspace
- **Type:** feature · **Priority:** P2 · **Status:** blocked (WH-009) · **Area:** client
- **What:** paginated member list (cursor pagination, as the API conventions require), with an optional search term.
- **Done when:** the list pages correctly and search works with WH-018.

### WH-017 · `useInviteMember()` and `useAcceptInvite()`
- **Type:** feature · **Priority:** P2 · **Status:** blocked (WH-010) · **Area:** client
- **What:**
  - `useInviteMember()`: mutation that sends an invite and refreshes the pending-invites list;
  - `useAcceptInvite(token)`: accepts an invite and refreshes `useSpaces`.
- **Done when:** expired, revoked and "wrong email" invites each show a clear translated message.

### WH-018 · `useDebouncedValue(value, ms)`: wait until typing stops
- **Type:** feature · **Priority:** P2 · **Status:** blocked (WH-016) · **Area:** client
- **What:** returns the value only after it stopped changing for `ms` milliseconds (default 300). Used by the member search.
- **Done when:** typing "mohammed" in member search sends 1 request, not 8 (unit test with fake timers).

### WH-019 · `useCan(permission)`: hide actions you're not allowed to do
- **Type:** feature · **Priority:** P2 · **Status:** blocked (WH-011) · **Area:** client
- **What:** `true`/`false` for a permission in the current workspace, using the same permission names as the API (shared constants).
- **Done when:** a member doesn't see "Invite" or "Change role" buttons; an admin does. The API still returns 403 if someone calls it anyway.

---

## Tech debt and small fixes

### WH-020 · Outdated comment in `merge-auth-openapi.ts`
- **Type:** tech-debt · **Priority:** P3 · **Status:** ready · **Area:** api
- **Why:** lines 16–17 say Better Auth's security markers are rewritten to the session cookie; the code now **drops** them.
- **Fix:** replace them with "drops Better Auth's security markers: it marks every route as protected, including public ones, which would put a lock on sign-up in Swagger."

### WH-021 · Request logs print every response header
- **Type:** tech-debt · **Priority:** P3 · **Status:** ready · **Area:** api
- **Why:** each request logs ~1.5 KB of headers (CSP, HSTS…), which buries useful lines in the dev server output.
- **Fix:** pino-http `serializers` that keep method, URL, status, duration and request id only.
- **Done when:** one request is one short log line, and the request id is still there.

### WH-022 · `server:openapi` (the `openapi.json` generator) needs a full `.env` and a running database
- **Type:** tech-debt · **Priority:** P3 · **Status:** later · **Area:** api
- **Why:** `generate-openapi.ts` only sets defaults for the old env vars, and `PrismaService` connects at startup. It can't run in CI without a database.
- **Fix when setting up CI:** default values for all required env vars, and no database connection needed to generate the document.

### WH-023 · Pages guarded only in the browser
- **Type:** tech-debt · **Priority:** P3 · **Status:** later · **Area:** client
- **Why:** `/app` shows "Checking session…" and then redirects, because the guard runs in the browser. It's safe (the API refuses data) but flickers.
- **Fix:** check the session server-side (middleware/proxy or a server component) and redirect before rendering.

### WH-024 · Rate-limit counters stored in memory
- **Type:** tech-debt · **Priority:** P3 · **Status:** later · **Area:** api
- **Why:** Better Auth's sign-in limits (5 a minute) reset when the server restarts, and don't work across several servers.
- **Fix:** move to Redis or the database when Redis arrives (BullMQ step) or before running more than one API instance.

### WH-025 · Decide the email-change and account-deletion flows
- **Type:** feature · **Priority:** P3 · **Status:** later · **Area:** api
- **Why:** `/change-email`, `/delete-user` and `/verify-password` are disabled until designed. Deletion must answer: what happens to workspaces the user owns? (GDPR, NFR-08)

### WH-026 · Deploy pipeline gaps (deferred by decision)
- **Type:** chore · **Priority:** P3 · **Status:** later · **Area:** deploy
- **Why:**
  - `deploy/deploy.sh` never runs `prisma migrate deploy`;
  - its health check uses `/health/live`, which doesn't check the database;
  - the migration URL needs its own root-only env file.
- **Fix when deployment work resumes.**

### WH-027 · Developer setup notes in the README
- **Type:** chore · **Priority:** P3 · **Status:** ready · **Area:** docs
- **Why:** a new developer needs: Node 22 (`nvm use`, `nvm alias default 22`), `docker compose up -d`, `pnpm db:seed`, the test accounts, Mailpit at `localhost:8025`, Swagger at `localhost:3333/docs`.
- **Done when:** a fresh clone can follow the README to a signed-in `/app` without asking anyone.

---

## Done

| Ticket / step | What | Commit |
|---|---|---|
| Step 1 | Postgres + Prisma 7 database layer, restricted app role, migrations, readiness check | `f950faa` |
| Step 2.2 | Auth tables, `Locale` enum, app-role grants as a migration | `f950faa` |
| Step 2.3 | Mail module (Mailpit locally), never throws, no addresses in logs | `f950faa` |
| Chore | Node 22 pinned (`.nvmrc`, `engines`) | `1ad74a9` |
| Step 2.4 | Better Auth email/password: sign-up, verification, sessions, reset, rate limits, `/me` | `303a3ed` |
| Step 2.4b | Auth routes in Swagger; unused Better Auth routes disabled | `b817153` |
| Step 2.5 | `PATCH /api/v1/me` to change language (`en`/`fr`/`ar`) | `ee36fdb` |
| Test fix | 5xx logging checked instead of printed in tests | `b284209` |
| Step 3 | `pnpm db:seed`: 4 verified-or-not test users in `en`/`fr`/`ar` | `4caff06` |
