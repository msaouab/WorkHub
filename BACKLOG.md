# WorkHub Backlog

The single list of planned work, bugs and tech debt. Tickets are **sorted by priority, then status** (P0 first; within a priority: start → in progress → under-review). Finished tickets are deleted; their history is in git.
Update it in the same commit as the work.

_Last updated: 2026-10-17_

## Workflow

All tickets are in **one list, sorted by priority** (P0 → P3), **then by status** (`start` → `in progress` → `under-review`), then by planned order. Each ticket's **Status** line says where it is:

| Status | Meaning | Who sets it |
|---|---|---|
| `start` | Created, not touched yet | Whoever creates the ticket |
| `in progress` | Someone started, or touched code in this ticket's scope | You, or Claude when it sees changes in that scope |
| `under-review` | You consider it finished and want it reviewed | **You** |
| `done` | Reviewed with no feedback against the Definition of Done **and committed** | **Claude**, which then **deletes the ticket from this file** |

```
start ──▶ in progress ──▶ under-review ──▶ done  (ticket deleted; history lives in git)
                ▲               │
                └── changes ────┘   (review found issues: the ticket goes back to
                    requested        `in progress` with a dated feedback checklist)
```

**Review rules (Claude's job):** for each ticket with status `under-review`:
1. Check every acceptance criterion and the Definition of Done: read the code, run `pnpm nx run-many -t typecheck lint test`, and check the running app for user-facing work.
2. **Correct, committed, and no feedback at all** → the ticket is **deleted** from this file, along with its Review tracker row. Its history stays in git through the ticket ID in the commit message.
3. **Any feedback** → the ticket goes back to **`in progress`**, gets a dated **Review** entry marked 🔁 *changes requested* with a checklist, and its Review tracker row is deleted. When the fixes land, set it to `under-review` again and it gets reviewed again.
4. New problems outside the ticket's scope become new `start` tickets, placed by priority.

**Automatic tracking:** Claude Code hooks (`.claude/settings.json`) run the tracker at the start of each session and on every message. When a ticket is `under-review` and hasn't been reviewed since its last change, or the file breaks a rule, Claude is told and reviews it. Each review either deletes the ticket or sends it back to `in progress`. (`pnpm backlog --mark-reviewed <IDs>` is still there for the rare ticket that has to stay under review, e.g. while waiting on a commit.)

Run `pnpm backlog` yourself to see the review queue (`⟳ needs review` marks what's pending) and every ticket by priority. It also catches format mistakes: unknown or `done` status, duplicate ID, wrong order, stale tracker.

**Ticket ID:** `WH-###`, never reused (not even after a ticket is deleted). New tickets take the next free number: **next free is WH-047**.
**Priority:** **P0** broken or insecure, fix first · **P1** current milestone · **P2** planned · **P3** nice to have / cleanup.
**Type:** `feature` · `bug` · `security` · `tech-debt` · `chore`

**Ticket format:**
- **Why**, **Scope**, **Acceptance criteria**;
- once work starts: dated **Progress** notes;
- after each review: a dated **Review** entry.
- **Blocked by** names a ticket that must be done first; **Depends on** is softer, "easier after".

**Roadmap (one feature at a time, backend and frontend together):**
1. Login UI + frontend foundation (translations, RTL, hooks). **Current milestone**
2. Workspaces, roles, memberships (+ per-workspace data isolation)
3. Invites (email and link, expiry, default role)
4. Permissions management
5. OAuth sign-in (Google, GitHub, Microsoft, GitLab)

## Definition of Done
A ticket moves to **Done** only when all of these hold. Problems found during review become checklist items on the ticket, or new tickets.

**Works**
- Every acceptance criterion is checked: in the running app for user-facing work, not just in tests.
- Error cases behave too, not only the happy path (bad input, signed out, API down, slow network).

**Correct and safe**
- The server enforces every rule; the client only hides UI.
- No secrets or personal data in logs, URLs or error messages.
- User input is validated with the shared Zod contracts.

**Follows the project's patterns**
- **Client:**
  - HTTP calls go in `lib/api/*`;
  - data in hooks uses TanStack Query with `queryKeys`;
  - text comes from `messages/{en,fr,ar}.json`, never hard-coded;
  - layout uses logical CSS (`start`/`end`, `ps`/`pe`) so Arabic mirrors.
- **API:**
  - errors are problem+json with a stable `code`;
  - request bodies are validated with `createZodDto`;
  - routes require sign-in unless marked `@AllowAnonymous()`.
- **Shared:** types, enums and lists that both sides use live in `libs/shared/*`, never copied.

**Clean**
- No duplicated logic, dead code, leftover `console.log`, commented-out code or unused imports.
- Names say what things do; comments explain *why*, not *what*.
- Small, focused functions and components.

**Checked**
- New logic has tests, including the edge cases.
- `pnpm nx run-many -t typecheck lint test` is green with **0 warnings**.
- Committed, with the ticket ID in the commit message (e.g. `WH-002: …`), so `git log --grep WH-002` finds it.

---

## Review tracker

One row per ticket whose status is `under-review`. Updated after every review; a ticket's row is deleted when it's done.

| Ticket | Under review since | Last review | Result | Open feedback |
|---|---|---|---|---|

## Tickets

Sorted by **priority** (P0 → P3), then by **status** (`start` → `in progress` → `under-review`), then by planned order. Done tickets are deleted.

### WH-036 · Bug: `pnpm dev` breaks with "Internal Server Error" after an unclean restart
- **Type:** bug · **Priority:** P0 · **Status:** in progress · **Area:** tooling
- **Why:** on 2026-10-17 every page returned 500 (`GET /en/sign-in?reset=1 500`, `SyntaxError: Unexpected non-whitespace character after JSON at position 573`) and the API exited with `NX Process exited with code 1`. Nothing in the app code was wrong; two leftovers from an earlier `pnpm dev` that didn't shut down cleanly caused it:
  1. **Corrupted Next.js dev manifest.** `apps/client/.next/dev/prerender-manifest.json` is 621 bytes: valid JSON for the first 573, then 48 bytes left over from an older, longer copy (`…6d0"}}621caa…6d0"}}`). The file was rewritten without being truncated, which happens when two `next dev` runs write to the same `.next/dev`. Next.js reads this file on every request, so every page fails.
  2. **Orphaned API server.** PID 8936 (started 10:51, parent PID 1, Node **v20**, while `pnpm dev` uses v22) still listens on `:3333` and the debugger port `:9229`. The new `nx serve server` can't bind and exits with code 1. Worse, the browser keeps talking to the **old** process, so the API runs stale code and reviews/browser checks test the wrong build.
- **Fix now (local):** stop `pnpm dev`, then `kill 8936`, `rm -rf apps/client/.next/dev`, and start `pnpm dev` again.
- **Scope (prevent it happening again):**
  - Before starting, `pnpm dev` checks that ports 3000, 3333 and 9229 are free. If not, it stops with a clear message naming the PID and command holding the port, instead of a bare `exit code 1`.
  - Add `pnpm dev:reset`: stops WorkHub dev processes left behind (only ones from this repo), and deletes `apps/client/.next/dev`.
  - Document both in the README developer notes (see WH-027).
- **Acceptance criteria:**
  - [x] With the fix above applied, `/en/sign-in`, `/fr/sign-in` and `/ar/sign-in` load (200) and the API answers on `:3333` from the current code. _(2026-10-17: all three sign-in pages 200; `/health/live` 200)_
  - [x] With an orphaned server holding `:3333`, `pnpm dev` prints which PID/command holds the port and how to fix it. _(2026-10-17: `tools/dev` check; foreign listener left alone)_
  - [x] `pnpm dev:reset` recovers from both problems above in one command, and touches no process outside this repo. _(clears `apps/client/.next`; kills only WorkHub listeners; live `planReset` would kill `next-server` + `@nx` serve; 14 unit tests)_
- **Depends on:** WH-027 (README) for the docs part.
- **Progress (2026-10-17):** `tools/dev` added (`pnpm dev` runs the port check first, `pnpm dev:reset`), with 9 unit tests. Docs are WH-027's.
- **Review (2026-10-17):** 🔁 changes requested. The port check works (it named `next-server` on `:3000` and exited 1), but `dev:reset` misses the processes it exists to kill:
  - [x] **Real Next and Nx processes are classified as "not WorkHub".** Next renames itself `next-server (v16.1.7)`; the API runs as `node … --inspect=localhost:9229 …/node_modules/@nx/js/dist/src/executors/node/node-with-esm-loader`. Neither matches `WORKHUB_MARKERS` (`/@nx/` ≠ `/nx/`), so `isWorkHubDevProcess()` returns `false` for both, even with `cwd` = repo root. Since only WorkHub's ports are inspected, "under this repo" is the real ownership check: accept `cwd` under the repo for `node`/`next-server`, or add `next-server` and `/@nx/` markers.
  - [x] **Tests use made-up command lines.** Use real `ps -o command=` output for `next dev` and `nx serve server`.
  - [x] **A sibling checkout counts as this repo.** `command.includes(repoRoot)` (`dev.mjs:37`) has no trailing `/`, so `…/WorkHub-fork` matches `…/WorkHub`. Use the same `${root}/` rule as `pathIsUnderRepo()`, plus a test.
  - [x] Browser-check AC 1 (`pnpm dev` from clean, all 3 sign-in pages 200, API on `:3333`).
  - [ ] Commit `tools/dev/` and `package.json`.
- **Review (2026-10-17, 2nd pass):** 🔁 changes requested. The fix is still uncommitted, and `pnpm nx run-many -t typecheck lint test` fails on this project:
  - [x] **Lint fails:** `tools/dev/src/dev.test.mjs:196`, `no-regex-spaces` (`/:9229  pid…/`). Use `/:9229 {2}pid…/` or build the expected string.
  - [x] **`next-server` is still "not WorkHub".** Checked against the live process on `:3000`: `isWorkHubDevProcess({ command: 'next-server (v16.1.7)', cwd: <repo> })` → `false`, so `dev:reset` would leave it running. Add `next-server` (and `/@nx/`) to `WORKHUB_MARKERS`, or trust `cwd` under the repo for `node`/`next-server`.
  - [x] **A sibling checkout still counts as this repo.** `isWorkHubDevProcess({ command: 'node /x/WorkHub-fork/…/next dev', repoRoot: '/x/WorkHub' })` → `true`. `dev.mjs:40` `command.includes(repoRoot)` needs the `${root}/` rule, plus a test.
  - [x] Tests with real `ps -o command=` lines (copy the `next-server` one above and the `@nx/js/…/node-with-esm-loader` one).
  - [x] AC 1 in the browser. At review time, the web app answered on `:3000`, but **nothing listened on `:3333`**: the API inside your running `pnpm dev` is down.
  - [ ] Commit `tools/dev/` and `package.json`.
- **Progress (2026-10-17):** `WORKHUB_MARKERS` includes `next-server` and `/@nx/`; `commandMentionsRepo` uses `${root}/`; tests use live `ps` lines; AC1 green. Only the commit remains.
- **Re-check (2026-10-17, 4th pass):** ✅ code is right. `next-server` and `/@nx/` are in `WORKHUB_MARKERS`; `commandMentionsRepo()` requires the `/` separator; the tests use real `ps` lines, including a sibling-checkout case; lint and tests pass. **Only the commit is left.**


### WH-044 · API structure: one library per domain, with enforced module boundaries
- **Type:** tech-debt · **Priority:** P0 · **Status:** in progress · **Area:** api + tooling
- **Why:** the team is growing, and invites, permissions and leave are about to land. Today `depConstraints` allows every project to import every other (`* → *`, `eslint.config.mjs:25`), so the tags are decoration, and domains are split between `apps/server/src/modules` (`me`) and `libs/api` (`spaces`). Moving now costs two small domains; after WH-010/011 it costs five.
- **Why libraries, not app folders:**
  - Nx enforces rules only between projects, never between folders inside one;
  - `index.ts` is the public API, so internal files can't be imported;
  - `nx affected` and the cache re-test only what changed;
  - `CODEOWNERS` maps one owner per domain;
  - other apps (the seed in WH-040, a future worker) can reuse services.
- **Target structure:**
  ```
  apps/
    server/src/                  wiring only, no business logic
      main.ts                    helmet, CORS, /api/v1 prefix, Swagger
      app.module.ts              imports domain modules; global guard/filter/pipe
      config/                    env schema → typed AppConfig
      swagger/                   builds the OpenAPI document   (was common/swagger)
      health/                    /health/live, /health/ready   (was modules/health)
    client/                      Next.js
    client-e2e/                  Playwright: critical flows only
  libs/
    api/                         scope:api
      users/        feature      GET/PATCH /me                  (was apps/server/src/modules/me)
      spaces/       feature      /spaces, /me/spaces
      access/       feature      SpaceGuard, @RequirePermission, SpaceAccess (was in core)
      auth/         data-access  Better Auth instance
      database/     data-access  Prisma, withTenant, migrations, RLS
      mail/         data-access  sending + templates
      core/         util         ProblemDetailsFilter, Swagger constants (no DB)
    shared/                      scope:shared, used by server and client
      contracts/    util         Zod request/response schemas
      constants/    util         error codes, permissions, locales
  tools/                         seed, backlog, dev
  docs/architecture.md
  CODEOWNERS
  ```
- **Every domain library has the same shape:**
  ```
  libs/api/<domain>/src/
    index.ts                     public API: the Module (+ a service only if another domain needs it)
    <domain>.module.ts
    controllers/                 HTTP only: routes, Swagger, guards
    <domain>.service.ts          business rules; every query through withTenant()
    dto/                         nestjs-zod DTOs built from @work-hub/contracts
    *.spec.ts                    unit tests
    *.integration.spec.ts        real Postgres (RLS, transactions)
  ```
- **Dependency rules (`depConstraints`):**

  | Tag | May import |
  |---|---|
  | `type:app` | anything |
  | `type:feature` | `data-access`, `util`, and another `feature` only through its `index.ts` |
  | `type:data-access` | `data-access`, `util` |
  | `type:util` | `util` only |
  | `scope:api` | `scope:api`, `scope:shared` |
  | `scope:client` | `scope:client`, `scope:shared` |
  | `scope:shared` | `scope:shared` only |

- **Steps:**
  - [x] Create `libs/api/users`:
    ```
    nx g @nx/nest:library libs/api/users --tags=scope:api,type:feature
    ```
    Move `apps/server/src/modules/me` into it (controller, `dto/update-me.dto.ts`, spec).
  - [x] Create `libs/api/access` (`scope:api,type:feature`). Move `SpaceGuard`, `RequirePermissionGuard`, `@RequirePermission`, `@CurrentSpaceAccess` and `SpaceAccess` out of `libs/api/core/src/space`, with their specs.
  - [x] Move `GET /me/spaces` from `MeController` into `libs/api/spaces` (`controllers/me-spaces.controller.ts`). Group the spaces controllers under `controllers/`, and the DTOs under `dto/`.
  - [x] In `apps/server/src`:
    - move `common/swagger` to `swagger/` and `modules/health` to `health/`;
    - move `common/guards/auth-throttle.ts` next to its single user, or into `core`;
    - delete the empty `.gitkeep` folders (`common/{decorators,filters,interceptors,middleware,pipes}`, `providers/`).
  - [x] Tag every project: `apps/client` as `scope:client,type:app`, `apps/client-e2e` as `scope:client,type:e2e`. Then replace `* → *` in `eslint.config.mjs` with the rules above.
  - [x] `pnpm nx sync`, then `pnpm nx run-many -t typecheck lint test`, all green.
  - [x] `CODEOWNERS`:
    - an owner per `libs/api/<domain>`;
    - a lead's review on `libs/shared/*` (a contract change touches both sides) and on `libs/api/database/prisma/migrations`.
  - [x] `docs/architecture.md`: the tree above, the rules table, and "how to add a domain".
- **Acceptance criteria:**
  - [x] No domain code is left in `apps/server/src`; only `main.ts`, `app.module.ts`, `config/`, `swagger/` and `health/` remain. _(plus wiring: `observe.ts`, `preload-env.ts`, `generate-openapi.ts`, `assets/`)_
  - [x] Importing `@work-hub/database` from a `type:util` lib, or any `scope:api` lib from `apps/client`, fails `pnpm nx lint` (check once, then revert).
  - [x] `pnpm nx run-many -t typecheck lint test` is green; `/api/v1/me`, `/api/v1/me/spaces` and Swagger work as before on the running app. _(`/me` + `/me/spaces` → 401 unsigned; `/docs` → 200)_
  - [x] `CODEOWNERS` and `docs/architecture.md` exist.
- **Progress (2026-10-17):** started. Do this before WH-040, WH-041 and WH-010, so new domains are born in the new layout.
- **Progress (2026-10-17):** `libs/api/{users,access}` created; space guards moved out of `core`; `GET /me/spaces` owned by `spaces`; server slimmed to wiring; `depConstraints` enforced; `CODEOWNERS` + `docs/architecture.md`; typecheck/lint/test green; live smoke on `:3333`.
- **Related:** WH-039 (its `core` → `PrismaService` and `/me/spaces` review items are fixed here); WH-038/039 should be committed first, so the move is a clean diff.
- **Review (2026-10-17):** 🔁 changes requested (small). The structure is right. Checked:
  - all 15 projects pass typecheck, lint and test, uncached;
  - **lint really enforces the rules:** temporary imports were rejected for `core` → `@work-hub/database` (util → data-access), `apps/client` → `@work-hub/spaces` (client → api) and `contracts` → `core` (shared → api);
  - live API: `/me` 200; `POST /spaces` 201 with Owner; duplicate slug 409; another user gets 404 and doesn't see it in `/me/spaces`; Swagger lists `/me`, `/me/spaces`, `/spaces`, `/spaces/{spaceId}`.
  - [x] **Controllers talk to Prisma.** `MeController` injects `PrismaService` and runs `prisma.user.update()` itself (`users/src/controllers/me.controller.ts:42,61`). That breaks the rule in our own `docs/architecture.md` ("controllers: HTTP; service: business rules"). Add `UsersService.updateLocale(userId, locale)`, and make the controller call it (plus a unit test for the service).
  - [x] **Dead code moved instead of deleted.** `AuthLoginThrottle` (`core/src/throttling/auth-throttle.ts`) is used nowhere, because Better Auth rate-limits sign-in itself, and its comment refers to a `POST /auth/login` that doesn't exist. Delete it and its export.
  - [x] **Two gaps in `depConstraints`:**
    - `type:app` → `type:e2e` is allowed, which is backwards (e2e tests the app; the app never imports e2e). Remove it.
    - `type:tool` has no rule, so `tools/seed` can import anything of any type. Add `type:tool` → `feature`, `data-access`, `util`.
    - Update the table in `docs/architecture.md` to match.
  - [x] `docs/architecture.md`, "How to add a domain": include the actual command, `pnpm nx g @nx/nest:library libs/api/<name> --tags=scope:api,type:feature`.
  - [ ] Commit (best as one commit of renames/moves, separate from WH-038/039's logic, so `git log --follow` keeps history).
- **Progress (2026-10-17):** review fixes applied (`UsersService`, throttle removed, depConstraints + docs). Commit still open.
- **Re-check (2026-10-17, 4th pass):** ✅ all feedback fixed: `UsersService` (with a spec) behind `MeController`, `AuthLoginThrottle` deleted, `type:app` no longer allows `e2e`, a `type:tool` rule added, the generator command in the docs. `PATCH /me` → 200 live. **Only the commit is left.**


### WH-045 · Bug: signed-in users can open sign-in/sign-up; rename `/app` → `/dashboard`
- **Type:** bug · **Priority:** P1 · **Status:** start · **Area:** client
- **Why:** a signed-in user who opens a link to `/sign-in` or `/sign-up` sees the form again instead of their workspace. Reproduced 2026-10-17 with a valid session cookie (`get-session` → 200): `GET /en/sign-in`, `/en/sign-up` and `/en/forgot-password` all return **200**, with no redirect. "App" is also a vague name for the signed-in home page; it becomes `/dashboard`.
- **Root cause:**
  - `src/proxy.ts` is only the next-intl middleware: it never looks at the session.
  - The `(auth)` layout has no guard at all.
  - The only check is in the browser (`useRequireAuth` on `/app`), and it works one way only: signed out → sign-in. Nothing sends signed-in users away from the auth pages.
  - This is also why `/app` flickers "Checking session…" (was WH-023, now part of this ticket).
- **Design (decided):** route decisions happen on the **server**, in `proxy.ts`, before anything renders.
  - Compose with next-intl: read the locale, check the session, then either redirect or hand the request to `createMiddleware(routing)`.
  - **Check the session for real; don't just look for the cookie.** Call the API's `GET /api/auth/get-session`, passing the request's `cookie` header, and only for the routes below.
    - A presence check (`getSessionCookie()`) isn't enough. With an expired or revoked cookie, the proxy would send `/sign-in` → `/dashboard`, the dashboard's client guard would send it back to `/sign-in`, and the user would be stuck in a **redirect loop**.
    - If the API is unreachable, treat the user as signed out (fail open to the public page, never loop). The API still protects all data.
  - **Rules:**

    | Route | Signed in | Signed out |
    |---|---|---|
    | `/{locale}/sign-in`, `/sign-up`, `/forgot-password` | → `/{locale}/dashboard` | show |
    | `/{locale}/dashboard/**` (and later `/s/**`) | show | → `/{locale}/sign-in` |
    | `/{locale}/reset-password`, `/verify-email` | show | show |
    | `/`, `/contact` | show | show |

    `reset-password` and `verify-email` stay open in both states: people reach them from an email link, possibly while signed in on another account.
  - Redirect to the **user's saved language** (`session.user.locale`) when it's valid, otherwise the URL's language. This matches the sign-in form.
  - `useRequireAuth` stays as a client-side fallback (e.g. sign-out on an open page). The proxy makes it a no-op on first load, so no flicker.
  - **Production note:** this works locally because cookies ignore the port (`localhost:3000` gets the cookie that `:3333` set). With the web app and the API on different hosts, the web server never receives the cookie. Before deploying, either serve the API under the web origin (a `/api` rewrite) or set Better Auth `advanced.crossSubDomainCookies`. Record it in WH-026.
- **Rename `/app` → `/dashboard`:**
  - move `src/app/[locale]/app/` to `src/app/[locale]/dashboard/`, and rename `AppHome` to `DashboardHome` (`components/auth/app-home.tsx` → `components/dashboard/dashboard-home.tsx`);
  - update every link and redirect:
    - `auth-nav.tsx:28` (`href`);
    - `sign-in-form.tsx:63` (`router.replace`);
    - the email `callbackURL`s in `sign-up-form.tsx:45` and `verify-email-panel.tsx:31`;
  - update the tests: `specs/use-locale-switcher.spec.tsx:26,108`, `specs/use-auth.spec.tsx:23`, and `client-e2e/src/auth-signup.spec.ts:49,67`;
  - put the route name in **one constant** (e.g. `ROUTES.dashboard` in `src/lib/routes.ts`) that the proxy, forms and nav all use, so the next rename touches one line;
  - **keep old links working:** verification emails already sent carry `callbackURL=/{locale}/app`. `/{locale}/app` must permanently redirect (308) to `/{locale}/dashboard`, via `redirects()` in `next.config` or the proxy.
- **Acceptance criteria:**
  - [ ] Signed in, opening `/en/sign-in`, `/en/sign-up` or `/en/forgot-password` lands on `/en/dashboard` (or the saved language's dashboard) through a server redirect: the form never flashes.
  - [ ] Signed out, opening `/en/dashboard` lands on `/en/sign-in` through a server redirect: no "Checking session…" flicker.
  - [ ] An expired or invalid session cookie shows the sign-in page, with **no redirect loop**.
  - [ ] With the API down, the auth pages still render (no 500, no loop).
  - [ ] Sign-in, sign-up verification and the nav link all go to `/dashboard`. `/en/app` returns 308 → `/en/dashboard`.
  - [ ] No `'/app'` string is left in `apps/client/src` (`grep` finds nothing outside the redirect).
  - [ ] Unit tests for the proxy's decision function: one per row of the table above, plus the stale-cookie and API-down cases. The e2e sign-up test asserts `/dashboard`.
  - [ ] Works in `en`, `fr` and `ar`.
- **Replaces:** WH-023 (pages guarded only in the browser).
- **Related:** WH-026 (cookies across hosts in production), WH-041 (workspace pages under `/s/{slug}` reuse the same proxy rules).

### WH-009 · Workspaces, roles and memberships (backend + UI)
- **Type:** feature · **Priority:** P1 (next milestone) · **Status:** start · **Area:** api + client + database
- **Why:** the core of the product. Users create workspaces, and every piece of business data belongs to exactly one workspace (SRS: "space").
- **Split into:** WH-038 (database + RLS) → WH-039 (API + guard) → WH-040 (seed) → WH-041 (UI). This ticket is done when all four are, plus the acceptance test below.
- **Scope:**
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

### WH-040 · Seed: an "Acme" workspace with owner, admin and member
- **Type:** chore · **Priority:** P1 · **Status:** start · **Area:** tools · **Part of:** WH-009
- **Blocked by:** WH-039
- **Why:** every workspace feature needs a ready-made workspace with one user per role to test against.
- **Scope:**
  - `pnpm db:seed` creates "Acme" (`acme`) with `owner@`, `admin@` and `member@workhub.test` in the matching roles.
  - Running it twice is safe.
  - `--reset` removes it.
- **Acceptance criteria:**
  - [ ] After `pnpm db:seed`, `member@workhub.test` sees Acme in `GET /me/spaces` with the Member role.
  - [ ] Running it twice changes nothing; `--reset` recreates it.

### WH-041 · Workspaces UI: create, switch, and workspace pages
- **Type:** feature · **Priority:** P1 · **Status:** start · **Area:** client · **Part of:** WH-009
- **Blocked by:** WH-039
- **Why:** users need to create and move between workspaces. Includes the planned hooks WH-014 (`useSpaces`) and WH-015 (`useSpace` / `useCurrentSpace`).
- **Scope:**
  - `/{locale}/spaces/new` (create form);
  - a workspace switcher in the header;
  - workspace pages under `/{locale}/s/{slug}`;
  - after sign-in, open your last workspace, or a picker if you have several;
  - a "no access" page for a slug you're not a member of.
- **Acceptance criteria:**
  - [ ] Creating a workspace redirects to `/{locale}/s/{slug}`, and it appears in the switcher without a reload.
  - [ ] Two tabs on two workspaces each show the right data.
  - [ ] Works in `en`, `fr` and `ar` (RTL).

### WH-006 · Browser test of every auth flow after the language move
- **Type:** chore · **Priority:** P1 · **Status:** in progress · **Area:** client + api
- **Why:** sign-up, verify, forgot and reset password have only been tested with curl, or not at all, since the web pages changed.
- **Scope:** manual browser pass, then one automated Playwright test in `apps/client-e2e`.
- **Acceptance criteria:**
  - [x] Manual, in `en` and `ar`: sign up → email in Mailpit → link signs in → `/app` shows the user → sign out.
    _2026-10-17: passed in `en` (by hand) and in `ar` (browser test): sign-up → `/ar/verify-email` → email link → `/ar/app` signed in → sign-out → `/ar/app` redirects to `/ar/sign-in`. Found WH-032 (language saved as `en`), WH-033, WH-034._
  - [x] Manual: forgot password → email → reset page → new password works, old one fails. _(2026-10-17: reset token used, all sessions revoked)_
  - [ ] Playwright test: sign up a new `@workhub.test` user, read the verification link from the Mailpit API (`GET localhost:8025/api/v1/message/latest`), open it, and assert `/app` shows the user's name.
  - [ ] The Playwright test cleans up after itself (or the suite runs `pnpm db:seed -- --reset` first).
- **Depends on:** WH-001, WH-002.
- **Progress (2026-10-17):** the manual pass is now complete in `en`, `ar` and `fr`: sign-up, verify, unverified redirect + resend, wrong password (translated), language switch, saved language after sign-in, sign-out with no data leak, forgot/reset. **Only the Playwright test is left.**
- **Review (2026-10-17, 2nd pass):** 🔁 changes requested (small):
  - [x] Playwright test written (`apps/client-e2e/src/auth-signup.spec.ts`): sign-up → Mailpit link → `/en/app` shows name and email. Good: unique email per run, Mailpit polled with a deadline.
  - [ ] **AC 4 not met: nothing cleans up.** Each run leaves an `e2e.<timestamp>@workhub.test` user. Add a Playwright `globalSetup` that runs `pnpm db:seed -- --reset`, or delete `e2e.%@workhub.test` users in `globalTeardown`.
  - [ ] Not run in this review: the API was down. Run `pnpm nx e2e client-e2e` once green.
  - [ ] Commit.
- **Re-check (2026-10-17, 4th pass):** no change since the last review. Cleanup (AC 4) and an actual `pnpm nx e2e client-e2e` run are still open.


### WH-038 · Workspaces database: spaces, roles, memberships, with row-level security
- **Type:** feature · **Priority:** P1 · **Status:** in progress · **Area:** database · **Part of:** WH-009
- **Why:** every business record will belong to exactly one workspace. Isolation must be enforced by **Postgres itself** (NFR-01), so a forgotten `where` in app code can't leak another company's data.
- **Scope:**
  - Prisma models:
    - `Space`: uuid v7, `name`, `slug` (citext, unique), `defaultRoleId`, timestamps, `deletedAt`;
    - `Role`: `spaceId`, `name`, `permissions text[]`, `isSystem`;
    - `Membership`: `spaceId`, `userId`, `roleId`, `status` = `active` | `deactivated`, unique (`spaceId`, `userId`).
  - A migration enabling **and forcing** row-level security on these tables:
    - policies match `current_setting('app.space_id', true)`;
    - users may also see their own memberships via `app.user_id`, which `GET /me/spaces` needs.
  - Permission catalog in `libs/shared/constants`: the permission names, and the system role presets (Owner, Admin, Member).
- **Acceptance criteria:**
  - [x] `prisma migrate deploy` on an empty database applies cleanly. _(single `spaces_roles_memberships` migration; local DB patched to match)_
  - [x] As `workhub_app`, with no `app.space_id` set, every query returns **0 rows** (fails closed).
  - [x] Integration test: with `app.space_id` = A, rows of workspace B are invisible.
  - [x] A test keeps the permission catalog and the system presets consistent.
- **Review (2026-10-17, 2nd pass):** 🔁 changes requested:
  - [x] Tables, `FORCE ROW LEVEL SECURITY`, fail-closed `NULLIF(current_setting(…, true), '')` policies; `rls.integration.spec.ts` (3 tests) passes, including "no `app.space_id` → 0 rows" and "A cannot see B".
  - [x] **Remove the `app.space_create` escape hatch** (`20261017130200_space_create_select_policy`). While it's `on`, `spaces_select` shows **every** workspace in the database: one missed reset, or any code that sets it, defeats RLS. Instead, create the id in the app (UUID v7), set `app.space_id` to it **before** the insert, and pass `id` to `space.create()`. `RETURNING` then passes the normal `id = app.space_id` rule. Drop `spaceCreate` from `TenantContext`.
  - [x] Since nothing is committed, fold the two migrations into one (`spaces_roles_memberships`).
  - [ ] Commit.
- **Progress (2026-10-17):** `space_create` removed; `spaces_insert` requires `id = app.space_id`; `uuidv7()` exported from `@work-hub/database`; create path updated in WH-039.
- **Re-check (2026-10-17, 4th pass):** the fix is right. The migrations are folded into `20261017125105_spaces_roles_memberships`, the dev database's `spaces_select` has no `space_create` clause, and `spaceCreate` is gone from `TenantContext`. `uuidv7()` has a spec. One blocker:
  - [ ] **The old migration is back on disk:** `prisma/migrations/20261017130200_space_create_select_policy/` (untracked, re-created 13:41, possibly by an editor undo). If it's committed, `prisma migrate deploy` on any fresh database **re-adds the "see every workspace" policy**. Delete the folder before committing, then check `ls prisma/migrations` shows 4 migrations.


### WH-039 · Workspaces API: create, list mine, and the workspace guard
- **Type:** feature · **Priority:** P1 · **Status:** in progress · **Area:** api · **Part of:** WH-009
- **Blocked by:** WH-038
- **Why:** the endpoints and the per-request access check every later feature (invites, permissions, leave) builds on.
- **Scope:**
  - **`POST /api/v1/spaces { name, slug }`**: in one transaction, create the space and its system roles, set Member as the default role, and make the creator Owner.
  - **`GET /api/v1/me/spaces`**: the current user's workspaces.
  - **`SpaceGuard`** on `/api/v1/spaces/:spaceId/**`:
    - loads the membership and role **fresh on every request**;
    - answers 404 when you're not a member (don't reveal the workspace exists), 403 when your membership is deactivated.
  - **`withTenant()`**: sets `app.space_id` / `app.user_id` inside a transaction.
  - **`@RequirePermission()`**: blocks a route unless your role has the named permission.
  - Request and response shapes in `libs/shared/contracts`.
- **Acceptance criteria:**
  - [x] Creating a workspace makes the creator Owner. A duplicate slug returns 409 problem+json.
  - [x] Guard tests: non-member → 404, deactivated → 403, member → allowed, with the role loaded per request.
  - [x] Cross-tenant integration test through the API: user A gets nothing of workspace B.
  - [x] Swagger documents the routes, with the session lock.
- **Review (2026-10-17, 2nd pass):** 🔁 changes requested:
  - [x] `SpaceGuard` (404 non-member, 403 deactivated, role loaded per request), `@RequirePermission`, `withTenant()`, 409 on duplicate slug; `spaces.integration.spec.ts` (5 tests) passes.
  - [x] Follows WH-038: `SpacesService.create()` sets `spaceCreate: true` (`spaces.service.ts:31`). Switch to "pre-generated id + `app.space_id` first".
  - [x] **Boundaries:** _(fixed in WH-044: `libs/api/access`)_ `@work-hub/core` is tagged `type:util` but `SpaceGuard` injects `PrismaService` (`type:data-access`). Move the guard, decorators and types into a `type:feature` access-control lib or `libs/api/spaces`, or retag `core`. See the structure note in WH-044.
  - [x] _(fixed in WH-044: `MeSpacesController` in `libs/api/spaces`)_ `GET /me/spaces` lives in the app's `MeController` but is implemented by `SpacesService`. Move it into `libs/api/spaces` (a `MeSpacesController` with `@Controller('me/spaces')`), so the workspace domain owns all of its routes.
  - [x] Running app checked (3rd pass, 2026-10-17): create 201 Owner, duplicate 409, non-member 404, `/me/spaces` scoped per user.
  - [x] **New: `GET /spaces/not-a-uuid` → 500.** `SpaceGuard` passes the raw `:spaceId` to Prisma, and Postgres rejects it as an invalid uuid. Guards run before pipes, so `ParseUUIDPipe` won't catch it: validate the format inside `SpaceGuard` (e.g. `z.uuid()`), and answer **404** (same as "not a member"), plus a guard test.
  - [ ] Commit.
- **Progress (2026-10-17):** create uses pre-generated `uuidv7` + `withTenant({ userId, spaceId })`; `SpaceGuard` rejects non-UUID `:spaceId` with 404.
- **Re-check (2026-10-17, 4th pass):** the code is right. `create()` pre-generates the id and sets `app.space_id` first; `SpaceGuard` rejects a non-UUID `:spaceId` with 404 (`SPACE_ID_RE`, with a test); `spaces.integration.spec.ts` passes.
  - [ ] **Live check pending: your running API is stale.** `apps/server/dist/main.js` was built at 13:24 and doesn't contain `SPACE_ID_RE`, so the live API still answers 500 for `/spaces/not-a-uuid` and for `POST /spaces` (the old code sets `app.space_create`, which the new database policy no longer honours). The watcher stopped rebuilding: restart `pnpm dev` (`pnpm dev:reset` first if needed), then re-check that create → 201, bad id → 404, other user → 404.


### WH-004 · Hooks foundation: `queryKeys`, `useAuth`, `useRequireAuth`
- **Type:** tech-debt · **Priority:** P1 · **Status:** in progress · **Area:** client
- **Why:** session logic is copied into `AppHome` and `AuthNav`, and each future page would copy it again. Cache keys written by hand (`['me']`) lead to "screen didn't update" bugs when a typo appears.
- **Scope:**
  - **`src/lib/api/query-keys.ts`:** every TanStack Query key in one object, e.g. `queryKeys.me`, `queryKeys.spaces.detail(slug)`. All hooks use it; no raw key arrays anywhere.
  - **`src/hooks/use-auth.ts` → `useAuth()`:** returns `{ user, isSignedIn, isPending, signOut }`. `signOut` signs out **and** clears the query cache (fixes WH-003).
  - **`src/hooks/use-require-auth.ts` → `useRequireAuth()`:** for signed-in pages. Redirects to `/{locale}/sign-in` when there's no session; returns the same values as `useAuth`. This is a user-experience guard only: the API still rejects every request without a session.
  - Replace the duplicated logic in `AppHome` (its `useEffect` redirect) and `AuthNav` with these hooks. Update `useMe` to use `queryKeys.me`.
- **Acceptance criteria:**
  - [x] `AppHome` and `AuthNav` contain no direct `authClient.useSession()` or `authClient.signOut()` calls.
  - [x] Opening `/en/app` while signed out redirects to `/en/sign-in`; while signed in, it shows the user.
  - [x] No raw query-key arrays remain in the client (`grep "queryKey: \['"` finds nothing).
  - [x] Unit tests for `useAuth` (sign-out clears the cache) and `useRequireAuth` (redirects when signed out).
- **Depends on:** WH-001 (redirect target is a localized URL).
- **Progress (2026-10-17):** `queryKeys`, `useAuth()`, `useRequireAuth()` done with 6 tests; `AppHome` and `AuthNav` use them; `/en/app` signed out → `/en/sign-in`.
- **Review (2026-10-17):** 🔁 changes requested:
  - [x] **Sign-out lands on a random page.** `useAuth().signOut()` does `router.replace('/')` (`use-auth.ts:23`) while the page's `useRequireAuth` sees the session vanish and does `router.replace('/sign-in')` (`use-require-auth.ts:14`); whichever runs last wins (browser check landed on `/ar/sign-in`). `isSigningOut` can't fix it as written: it's `useState` per `useAuth()` call, so `AuthNav`'s instance and `AppHome`'s guard don't share it. Use shared state (module flag, small store or the query cache), or pick one destination, e.g. `signOut({ redirectTo })`.
  - [x] A test for the race: sign out with `useRequireAuth` mounted, assert exactly one redirect.
  - [x] **Dead code in `useMe`:** `sessionPending` and `signedIn` are returned but never read. Remove them.
  - [x] **Dead placeholder in `AppHome`:** `locale: '…'` in the fallback object can never be shown. Drop it.
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** 🔁 changes requested (small): the earlier feedback is fixed. A module-level `signingOut` flag shared by `useAuth` and `useRequireAuth`, one destination (`/sign-in`), `useMe` dead fields gone, `AppHome` placeholder gone; tests pass.
  - [x] The race test should assert **exactly one** redirect, as the earlier item asked: `expect(mocks.replace).toHaveBeenCalledOnce()` (`use-auth.spec.tsx`), not only `toHaveBeenCalledWith`.
  - [ ] Commit.
- **Re-check (2026-10-17, 4th pass):** ✅ the race test now asserts `toHaveBeenCalledOnce()` (`use-auth.spec.tsx:105`). **Only the commit is left.**


### WH-001 · Finish moving the web app to language URLs (`/en`, `/fr`, `/ar`)
- **Type:** feature · **Priority:** P1 · **Status:** in progress · **Area:** client
- **Why:** NFR-10 requires EN and AR at launch (FR later), with full right-to-left layout for Arabic. Every later page builds on this, so it must be finished first.
- **Scope:**
  - All pages live under `apps/client/src/app/[locale]/`.
  - Text comes from `src/messages/{en,fr,ar}.json` through next-intl.
  - `<html lang dir>` follows the language: `rtl` for `ar`, using `RTL_LOCALES` from `@work-hub/constants`.
  - The language list comes from the shared `LOCALES`, never a separate list.
- **Acceptance criteria:**
  - [x] Every page (`/`, `/contact`, `/sign-in`, `/sign-up`, `/verify-email`, `/forgot-password`, `/reset-password`, `/app`) loads under `/en`, `/fr` and `/ar` with no 404. _(24/24 checked 2026-10-17)_
  - [x] Visiting a page without a language (e.g. `/sign-in`) redirects to the default language (`/en/sign-in`). _(307 → `/en/sign-in`)_
  - [x] `/ar/...` renders with `dir="rtl"` and the Arabic font (IBM Plex Sans Arabic).
  - [x] The layout is visibly mirrored in Arabic. _(browser check 2026-10-17: logo right, labels right-aligned, sign-up/verify/app pages)_
  - [x] No English text left hard-coded in components; every string is in the 3 message files.
  - [x] All 3 message files have the same keys, **checked by a test**. Today they match (159 keys each), but nothing stops them drifting.
  - [x] Rename `src/middleware.ts` → `src/proxy.ts`. Confirmed: Next.js 16 deprecates the `middleware` file name (https://nextjs.org/docs/messages/middleware-to-proxy).
  - [x] `pnpm nx run-many -t typecheck lint test --projects=@work-hub/client` is green.
  - [x] Commit the `nx sync` change in `apps/client/tsconfig.json` (new reference to `libs/shared/constants`). _(in `96c3d33`)_
- **Notes:** the main work landed in `fbff533`; review fixes in `96c3d33` (`proxy.ts`, message-key test, `localeFontClass()`, `isAppLocale()`).
- **Review (2026-10-17):** 🔁 changes requested:
  - [x] `layout.tsx:46`: drop the `rawLocale as Locale` cast. `routing.locales` comes from `LOCALES`, so `hasLocale()` already narrows `rawLocale` to `Locale`.
  - [x] Optional: `localeFontClass()` picks the Arabic font for *any* RTL language; a per-language map (`{ ar: 'font-arabic' }`) is exact. _(skipped — fine per 2nd pass)_
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** 🔁 changes requested: only the commit is left. The `rawLocale as Locale` cast is gone and `hasLocale()` narrows the type; tests pass. The optional font map wasn't done, which is fine.
  - [ ] Commit.
- **Re-check (2026-10-17, 4th pass):** ✅ unchanged and green. **Only the commit is left.**


### WH-033 · Bug: sign-in and sign-up errors are always in English
- **Type:** bug · **Priority:** P1 · **Status:** in progress · **Area:** client
- **Why:** on `/ar/sign-in`, a failed sign-in shows Better Auth's English text ("Email not verified", "Invalid email or password"…), because `authErrorMessage()` shows `error.message` as-is.
- **Scope:** map Better Auth error **codes** to translated messages in `messages/{en,fr,ar}.json`. The codes include `INVALID_EMAIL_OR_PASSWORD`, `EMAIL_NOT_VERIFIED`, `USER_ALREADY_EXISTS`, `PASSWORD_TOO_SHORT`, `INVALID_TOKEN` and 429 (too many attempts). Unknown codes fall back to a translated "Something went wrong". Never show the server's raw English text.
- **Acceptance criteria:**
  - [x] Wrong password on `/ar/sign-in` shows Arabic text; on `/fr/sign-in`, French. _(browser 2026-10-17)_
  - [x] ~~Signing up with an existing email shows "account already exists"~~. **Corrected 2026-10-17:** with email verification on, Better Auth deliberately answers a duplicate sign-up exactly like a new one (no error, no email, nothing changed), so nobody can probe which emails have accounts. Verified with `member@workhub.test`. The right check: a duplicate sign-up shows the same "check your email" screen as a new one.
  - [x] Six quick wrong attempts show a translated "too many attempts" message. _(browser 2026-10-17)_
  - [x] A unit test covers the code → message mapping, including the fallback.
- **Related:** WH-002 (that code redirects instead of showing a message).
- **Progress (2026-10-17):** `authErrorKey()` maps codes → translated keys and never returns server text (tested, incl. an "Internal prisma dump" case); all 5 forms use it; 429 handled by status. Committed in `96c3d33`.
- **Review (2026-10-17):** 🔁 changes requested:
  - [x] **Dead `USER_ALREADY_EXISTS` entry** (`auth-errors.ts:5`, line 194 of all 3 message files, `specs/auth-errors.spec.ts:24`). Better Auth 1.7.7 `sign-up.mjs`: with `requireEmailVerification` on, a duplicate sign-up returns the generic success; with it off, the code is `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`. It can never match. Remove the code, its 3 translations and the assertion.
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** 🔁 changes requested: only the commit is left. `USER_ALREADY_EXISTS` is removed from `auth-errors.ts`, from the spec, and from all 3 message files (0 matches); tests pass.
  - [ ] Commit.
- **Re-check (2026-10-17, 4th pass):** ✅ unchanged and green. **Only the commit is left.**


### WH-007 · Forms: switch the auth forms to React Hook Form + Zod
- **Type:** tech-debt · **Priority:** P2 · **Status:** start · **Area:** client
- **Why:** the 5 auth forms each repeat the same `useState` for values, error and pending state. The SRS chooses React Hook Form + Zod for forms, and the schemas already exist (`src/lib/validators/auth.ts`).
- **Scope:** use `react-hook-form` with `@hookform/resolvers/zod` in sign-in, sign-up, forgot-password, reset-password and contact. Show errors next to each field instead of one message at the bottom.
- **Acceptance criteria:**
  - [ ] No form component keeps its own `useState` for field values.
  - [ ] Each invalid field shows its own translated message.
  - [ ] Submit is disabled while sending, as today.
- **Depends on:** WH-001 (messages must be translated).

### WH-032 · Sign-up saves the page's language, not always `en`
- **Type:** bug · **Priority:** P2 · **Status:** start · **Area:** api + client
- **Why:** someone who signs up on `/ar/sign-up` gets `locale = en` in the database, because Better Auth's `locale` field is locked at sign-up (`input: false`) and nothing sets it afterwards. Their emails and their next sign-in then default to English.
- **Scope:** pick one approach:
  - (a) after the email link signs the user in for the first time, the client calls `PATCH /api/v1/me` with the URL's language, using `useUpdateMe` from WH-005;
  - (b) server-side: a Better Auth `databaseHooks.user.create.before` hook reads the language (from a header the client sends, or `Accept-Language`) and validates it against `LOCALES` before saving.
  (b) is more reliable, because it also works if the user never opens the web app after verifying.
- **Acceptance criteria:**
  - [ ] Signing up on `/ar/sign-up` stores `locale = ar`; on `/fr/sign-up`, `fr`; on `/en/sign-up`, `en`.
  - [ ] An unsupported value can never be stored (falls back to `en`).
  - [ ] The verification email itself is in that language once WH-013 is done.
- **Depends on:** WH-005 for (a); nothing for (b).

### WH-046 · Members API: list, deactivate, remove, leave
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api
- **Blocked by:** WH-039
- **Why:** nothing on the API side lists or manages a workspace's members yet. WH-016 (`useMembers`) has no endpoint to call, and invites (WH-010) and role changes (WH-011) both need a member list to show their results.
- **Scope** (in `libs/api/spaces`, or a new `libs/api/members` if it grows):
  - `GET /api/v1/spaces/{spaceId}/members?cursor=&limit=&q=`: cursor pagination (`cursorPaginationQuerySchema`), search by name/email, and each member's role and status. Needs `members.read`.
  - `POST /api/v1/spaces/{spaceId}/members/{membershipId}/deactivate` and `/reactivate`: needs `members.write`.
  - `DELETE /api/v1/spaces/{spaceId}/members/{membershipId}`: remove a member. Needs `members.write`.
  - `DELETE /api/v1/spaces/{spaceId}/members/me`: leave a workspace.
  - **Safety rules:**
    - nobody can deactivate or remove an Owner;
    - the last Owner can't leave (transfer ownership first, in WH-011);
    - you can't deactivate yourself.
  - Request and response shapes in `libs/shared/contracts`.
- **Acceptance criteria:**
  - [ ] The member list pages correctly (cursor) and search narrows it. A `member` role without `members.read` gets 403.
  - [ ] A deactivated member gets 403 on that workspace's routes, on the next request (the role is loaded per request).
  - [ ] Each safety rule is covered by a test; a cross-tenant integration test shows workspace A's admin can't touch workspace B's members (404).

### WH-010 · Invites by email and by link
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client
- **Why:** your original requirement. Join a workspace only by invite (email or link); invites expire; new members get the workspace's default role.
- **Scope:**
  - email invites: single use, tied to one email address, 7 days;
  - invite links: maximum number of uses, expiry, can be revoked;
  - only a hash of each token is stored;
  - accept flow `/{locale}/invite/{token}` (sign in or sign up first, then join);
  - hooks WH-016, WH-017, WH-018.
- **Depends on:** WH-009.
- **Plan (2026-10-17):** too big for one ticket. Split it like WH-009 when it starts:
  1. database: `invites` table (`token_hash`, `email` or link, `role_id`, `expires_at`, `max_uses`/`uses`, `revoked_at`), with RLS;
  2. API: create, list, revoke, preview and accept;
  3. the invite email (with WH-013, in the invitee's language);
  4. the accept page.
  - **Accepting needs a return URL:** a signed-out invitee goes to sign-in or sign-up, then comes **back** to `/{locale}/invite/{token}`. The WH-045 proxy and sign-in form need a safe `?next=` parameter (same-origin paths only, never a full URL).
  - **Depends on:** WH-046 (members) and WH-045 (proxy + `next`).

### WH-011 · Permissions management
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client
- **Why:** your original requirement. Workspace admins set what each member can do and can change anyone's role.
- **Scope:**
  - change a member's role;
  - custom roles;
  - safety rules (you can't give permissions you don't have, can't change your own role, the owner role is locked);
  - UI: members and roles settings;
  - hook WH-019.
- **Depends on:** WH-009.

### WH-012 · Sign in with Google, GitHub, Microsoft and GitLab
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client
- **Why:** your original requirement.
- **Scope:**
  - configure the 4 providers in `createAuth`;
  - re-enable `/sign-in/social`, `/link-social` and `/unlink-account` in `DISABLED_PATHS`;
  - "Continue with …" buttons;
  - account-linking rules: only link automatically when the provider confirms the email is verified, so never automatically for Microsoft;
  - "My sign-in methods" in settings.
- **Depends on:** WH-001.

### WH-013 · Emails in the user's language
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api
- **Why:** verification and reset emails are English only, even for Arabic users (NFR-10).
- **Scope:** `MailService` templates per locale (`en`, `fr`, `ar`, with RTL in the HTML for Arabic). The user's `locale` picks the template.

### WH-014 · `useSpaces()`: my workspaces
- **Blocked by:** WH-009
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** client
- **What:** list of the current user's workspaces (`GET /api/v1/me/spaces`), for the workspace switcher and "pick a workspace" page. Key `queryKeys.spaces.all`.
- **Done when:** creating a workspace adds it to the switcher without a page reload (cache invalidated).

### WH-015 · `useSpace(slug)` / `useCurrentSpace()`: the workspace in the URL
- **Blocked by:** WH-009
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** client
- **What:**
  - `useSpace(slug)` loads one workspace (`queryKeys.spaces.detail(slug)`);
  - `useCurrentSpace()` reads the slug from the `/s/{slug}` URL and calls `useSpace`.
- **Done when:** two browser tabs on two different workspaces each show the right data; a slug you're not a member of shows a "no access" page.

### WH-016 · `useMembers(spaceId)`: members of a workspace
- **Blocked by:** WH-009
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** client
- **What:** paginated member list (cursor pagination, as the API conventions require), with an optional search term.
- **Done when:** the list pages correctly and search works with WH-018.

### WH-017 · `useInviteMember()` and `useAcceptInvite()`
- **Blocked by:** WH-010
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** client
- **What:**
  - `useInviteMember()`: mutation that sends an invite and refreshes the pending-invites list;
  - `useAcceptInvite(token)`: accepts an invite and refreshes `useSpaces`.
- **Done when:** expired, revoked and "wrong email" invites each show a clear translated message.

### WH-018 · `useDebouncedValue(value, ms)`: wait until typing stops
- **Blocked by:** WH-016
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** client
- **What:** returns the value only after it stopped changing for `ms` milliseconds (default 300). Used by the member search.
- **Done when:** typing "mohammed" in member search sends 1 request, not 8 (unit test with fake timers).

### WH-019 · `useCan(permission)`: hide actions you're not allowed to do
- **Blocked by:** WH-011
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** client
- **What:** `true`/`false` for a permission in the current workspace, using the same permission names as the API (shared constants).
- **Done when:** a member doesn't see "Invite" or "Change role" buttons; an admin does. The API still returns 403 if someone calls it anyway.

### WH-043 · Remove the unused `JoinPreview` scaffold (and Zustand)
- **Type:** tech-debt · **Priority:** P3 · **Status:** start · **Area:** client
- **Why:** found while reviewing WH-001. `src/components/join-preview.tsx` is imported nowhere, yet it holds hard-coded English ("Join a space", "Invalid input", "Ready to join with …"). It's the only user of `src/stores/ui-store.ts` and `src/lib/validators/join-space.ts`, and `ui-store` is the only use of the `zustand` dependency.
- **Scope:** delete the 3 files and remove `zustand` from `apps/client/package.json`, unless the workspaces UI (WH-041) needs a client store. If it does, keep Zustand and say so here.
- **Acceptance criteria:**
  - [ ] No unused components, stores or validators are left in `apps/client/src`.
  - [ ] `pnpm nx run-many -t typecheck lint test` is green.

### WH-042 · Dark mode: decide, then implement or remove the unused styles
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** client
- **Why:** `global.css` has a `.dark` block, but nothing ever turns it on, and it defines no brand colors. WH-037's "check in dark mode" couldn't be done.
- **Scope:** decide whether WorkHub supports dark mode.
  - **If yes:** follow the system preference (with an optional toggle), define the brand tokens under `.dark`, and check every page, including the logo loader.
  - **If no:** delete the dead `.dark` block.
- **Acceptance criteria:**
  - [ ] A decision is recorded here, and either every page reads well in dark mode, or the `.dark` block is gone.

### WH-008 · Bug: the sign-in "Email verified" banner never appears
- **Type:** bug · **Priority:** P3 · **Status:** start · **Area:** client
- **Why:** `sign-in-form.tsx` shows a banner when the URL has `?verified=1`, but nothing links there. The verification email sends users to `/app`, already signed in.
- **Scope:** decide one of two options:
  - (a) remove the banner and its message keys;
  - (b) show a one-time "Email verified" notice on `/app` instead (e.g. `callbackURL` → `/{locale}/app?verified=1`).
- **Acceptance criteria:**
  - [ ] No dead code path: either the banner is gone, or it appears after verifying.

### WH-021 · Request logs print every response header
- **Type:** tech-debt · **Priority:** P3 · **Status:** start · **Area:** api
- **Why:** each request logs ~1.5 KB of headers (CSP, HSTS…), which buries useful lines in the dev server output.
- **Fix:** pino-http `serializers` that keep method, URL, status, duration and request id only.
- **Done when:** one request is one short log line, and the request id is still there.

### WH-022 · `server:openapi` (the `openapi.json` generator) needs a full `.env` and a running database
- **Type:** tech-debt · **Priority:** P3 · **Status:** start · **Area:** api
- **Why:** `generate-openapi.ts` only sets defaults for the old env vars, and `PrismaService` connects at startup. It can't run in CI without a database.
- **Fix when setting up CI:** default values for all required env vars, and no database connection needed to generate the document.

### WH-024 · Rate-limit counters stored in memory
- **Type:** tech-debt · **Priority:** P3 · **Status:** start · **Area:** api
- **Why:** Better Auth's sign-in limits (5 a minute) reset when the server restarts, and don't work across several servers.
- **Fix:** move to Redis or the database when Redis arrives (BullMQ step) or before running more than one API instance.

### WH-025 · Decide the email-change and account-deletion flows
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** api
- **Why:** `/change-email`, `/delete-user` and `/verify-password` are disabled until designed. Deletion must answer: what happens to workspaces the user owns? (GDPR, NFR-08)

### WH-026 · Deploy pipeline gaps (deferred by decision)
- **Type:** chore · **Priority:** P3 · **Status:** start · **Area:** deploy
- **Why:**
  - `deploy/deploy.sh` never runs `prisma migrate deploy`;
  - its health check uses `/health/live`, which doesn't check the database;
  - the migration URL needs its own root-only env file.
- **Fix when deployment work resumes.**
- **Gap (from WH-045):** session cookies are set by the API host. If the web app is served from a different host, `proxy.ts` never receives the cookie. Serve the API under the web origin (a `/api` rewrite), or set Better Auth `advanced.crossSubDomainCookies`.


### WH-027 · Developer setup notes in the README
- **Type:** chore · **Priority:** P3 · **Status:** start · **Area:** docs
- **Why:** a new developer needs: Node 22 (`nvm use`, `nvm alias default 22`), `docker compose up -d`, `pnpm db:seed`, the test accounts, Mailpit at `localhost:8025`, Swagger at `localhost:3333/docs`.
- **Done when:** a fresh clone can follow the README to a signed-in `/app` without asking anyone.
