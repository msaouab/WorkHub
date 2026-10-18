# WorkHub Backlog

The single list of planned work, bugs and tech debt. Tickets are **sorted by priority, then status** (P0 first; within a priority: start → in progress → under-review). Finished tickets are deleted; their history is in git.
Update it in the same commit as the work.

_Last updated: 2026-10-18_

## Workflow

All tickets are in **one list, sorted by priority** (P0 → P3), **then by status** (`start` → `in progress` → `under-review` → `done`), then by planned order. Each ticket's **Status** line says where it is:

| Status | Meaning | Who sets it |
|---|---|---|
| `start` | Planned: the **next implementations**, in priority and planned order | Whoever creates the ticket |
| `in progress` | The **current** implementation | Claude, right after the previous commit (or you, when you start one) |
| `under-review` | You consider it finished and want it reviewed | **You** |
| `done` | Reviewed with no feedback; **Claude gives the commit message**; waiting to be committed | **Claude**, after the review |

```
start ──▶ in progress ──▶ under-review ──▶ done ──▶ commit ──▶ delete ──┐
(next)    (current)          │ review     (+ commit       (history     │
  ▲             ▲            │            message)        lives in git)│
  │             └─ feedback ─┘                                        │
  └────────── after the commit, the next start ticket(s) ─────────────┘
              move to in progress
```

**Review rules (Claude's job):** for each ticket with status `under-review`:
1. Check every acceptance criterion and the Definition of Done: read the code, run `pnpm quality`, and check the running app for user-facing work. For **user-facing** tickets (client routes, nav, pages that replace a coming-soon placeholder), also run `pnpm nx e2e @work-hub/client-e2e` against a local `pnpm dev` (or confirm the PR's **Playwright e2e** check is green) so a page moving from coming-soon to real cannot slip through.
2. **No feedback at all** → status **`done`**, its Review tracker row deleted, and Claude **gives the commit message** for the done tickets. The ticket **stays in the file** until it's committed.
3. **Any feedback** → back to **`in progress`**, with a dated **Review** entry marked 🔁 *changes requested* (a checklist), and its tracker row deleted. When the fixes land, set it to `under-review` again.
4. **After the commit** that carries a ticket as `done` (it's `done` in `HEAD`'s copy of this file), Claude **deletes** it, and **moves the next implementations from `start` to `in progress`**: every `start` ticket at the highest remaining priority (the current milestone), in planned order. The deletion and the move go into the next commit.
5. New problems outside the ticket's scope become new `start` tickets, placed by priority.

**Automatic tracking:** Claude Code hooks (`.claude/settings.json`) run the tracker at the start of each session and on every message. Claude is told when a ticket is `under-review` and hasn't been reviewed since its last change, when `done` tickets are committed and ready to delete, or when the file breaks a rule.

**Quality pipeline and gates:** `pnpm quality` runs every check and prints a summary:
1. the backlog rules;
2. `nx sync:check`;
3. typecheck, lint and test for all projects (lint includes **no hard-coded UI text**, via `react/jsx-no-literals`, and the module-boundary rules);
4. **knip** for unused files, exports and dependencies;
5. **unused translation keys**.

The git hooks (`.githooks/`, enabled by `pnpm install`) add two gates:
- **Commit gate**, `pre-commit` → `pnpm quality --gate`: you can commit only when **no ticket is `in progress` or `under-review`**. Everything you worked on has been reviewed and is `done`. A ticket you started but won't finish goes back to `start`.
- **Push gate**, `pre-push` → `pnpm quality --push`: push only finished work. It blocks when an outgoing commit names (`WH-###` in its message) a ticket that is still `in progress` or `under-review`.

`git commit/push --no-verify` bypasses them, for emergencies only.

**Branches and pull requests (since 2026-10-18):** `main` is protected by the ruleset in `.github/rulesets/main.json`: no direct pushes, force-pushes or deletion; changes arrive by **pull request** with **both CI checks green** (`Quality + integration`, `Playwright e2e`) on an up-to-date branch, all conversations resolved, **squash merge** only (linear history), 0 approvals while there's one developer. Per ticket:
1. Work on a branch named after the ticket(s), e.g. `wh-011-permissions` (`git switch -c wh-011-permissions`).
2. Review → `done` → commit on the branch (the commit gate applies).
3. Push the branch (the push gate applies), open a PR whose **title is the commit subject** (`WH-011: …`), since the squash commit on `main` uses it.
4. CI green → **Squash and merge** → delete the branch → `git switch main && git pull`.
5. Claude deletes the merged `done` tickets and moves the next implementations to `in progress`.

Run `pnpm backlog` yourself to see the review queue (`⟳ needs review` marks what's pending) and every ticket by priority. It also lists committed `done` tickets to delete, and catches format mistakes: unknown status, duplicate ID, wrong order, stale tracker.

**Ticket ID:** `WH-###`, never reused (not even after a ticket is deleted). New tickets take the next free number: **next free is WH-080**.
**Priority:** **P0** broken or insecure, fix first · **P1** the **next roadmap milestone only** (so "move the next implementations" after a commit picks exactly that milestone) · **P2** planned · **P3** nice to have / cleanup. When a milestone is done, raise the next roadmap step's tickets to P1.
**Type:** `feature` · `bug` · `security` · `tech-debt` · `chore`

**Ticket format:**
- **Why**, **Scope**, **Acceptance criteria**;
- once work starts: dated **Progress** notes;
- after each review: a dated **Review** entry.
- **Blocked by** names a ticket that must be done first; **Depends on** is softer, "easier after".

**Roadmap (one feature at a time, backend and frontend together):**
1. ~~Login UI + frontend foundation~~ · ~~workspaces, roles, memberships + isolation~~ · ~~app shell~~ · ~~members~~ · ~~invites + Team page~~ · ~~quality gate, e2e, CI, protected `main`~~ · ~~permissions, groups + Manager role~~ (done)
2. **Workspace setup and holidays (WH-056, WH-063).** **Next milestone (P1)**: country, timezone and work week, then public and company holidays; leave depends on both.
3. Leave: WH-060 → WH-061 → WH-062 → WH-064
4. Documents (WH-065), notifications and emails in the user's language (WH-066, WH-013)
5. OAuth sign-in (WH-012), error pages (WH-055), profiles, sessions, 2FA, domain join

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

### WH-079 · Bug: CI e2e fails on the WH-011 PR, and the branch carries an unrelated `develop` commit
- **Type:** bug · **Priority:** P0 · **Status:** done · **Area:** tooling (e2e, git)
- **Why:** the PR for `wh-011-permissions` can't merge. **CI / Playwright e2e** fails 1 of 13 tests: `app-shell.spec.ts:7` "owner sees full nav and every item opens its route" waits for "We're building this. It'll be ready soon." on `/en/s/acme/roles`, but **WH-011 made Roles a real page** (`space-nav.ts` `roles` → `status: 'ready'`). The test kept the old coming-soon list (failed with 2 retries; the other 12 passed). The reviews missed it because `pnpm quality` doesn't run e2e and the WH-011 review didn't run it either.
  - Also found: `ec7f2af` merged `origin/develop` into the branch. `develop` holds only `2e37e4c` "Initial commit: Spring Boot project setup", **unrelated history** from another project. It changed no files, but it puts a foreign root commit in the PR.
- **Scope:**
  - [x] `apps/client-e2e/src/app-shell.spec.ts`: remove `/en/s/acme/roles` from `comingSoonRoutes`; after the loop, assert the real Roles page (heading "Roles and permissions", and no coming-soon text: `toHaveCount(0)`).
  - [x] Drop the stray merge from the feature branch (`git reset --hard cb49b24` before the fix, then `git push --force-with-lease`; the ruleset only protects `main`).
  - [x] Decide on `origin/develop`: deleted (`git push origin --delete develop`) — leftover Spring Boot initial commit only.
  - [x] Run `pnpm nx e2e @work-hub/client-e2e` locally against `pnpm dev`: 13/13.
  - [x] **Process:** add "run e2e for user-facing tickets" to the review rules (Workflow → Review rules, step 1), so a page moving from coming-soon to real can't slip through again.
- **Acceptance criteria:**
  - [ ] The PR's **Playwright e2e** and **Quality + integration** checks are green; the PR history shows no `develop` commit.
  - [ ] The PR can be squash-merged (ruleset satisfied).
- **Blocks:** merging WH-011, WH-058, WH-077 and WH-078 (all `done` on this branch).
- **Progress (2026-10-18):** reset branch to `cb49b24` (dropped `ec7f2af` + foreign `2e37e4c`); fixed `app-shell.spec.ts` Roles assertion; review rule updated; `origin/develop` deleted; local e2e **13/13**.
- **Commit message:** `WH-079: Fix Roles e2e after WH-011 and drop the stray develop merge`
- **Review (2026-10-18):** ✅ **done.** `pnpm quality` all green; **e2e 13/13** locally against `pnpm dev` (the new Roles assertion passes); the branch history is linear (`cb49b24` on `e9608e2`, no `develop` commit); `origin/develop` deleted; Review rule 1 now requires e2e for user-facing tickets. The two PR criteria (checks green, mergeable) are confirmed by the PR after the push.
  - Note: `origin/wh-011-permissions` still points at the old merge `ec7f2af`. The next push must be `git push --force-with-lease` to replace it.

### WH-056 · Workspace setup: country, timezone, work week; edit name and slug
- **Type:** feature · **Priority:** P1 · **Status:** start · **Area:** api + client + database
- **Why:** FR-SPC-01 requires a workspace to have a **country, timezone and work week**. Leave days (FR-LVR-02), accruals (FR-LVB-03) and public holidays (FR-HOL-01) all depend on them, and today a workspace only has a name and slug. The settings page also says "editing the name and slug will be available soon".
- **Scope:**
  - columns `country` (ISO 3166-1 alpha-2), `timezone` (IANA), `work_week` (e.g. `{mon..fri}`), with a migration and defaults for existing rows;
  - the create form asks for country (prefilled from the browser locale) and timezone (prefilled from `Intl`), plus the work-week preset;
  - `PATCH /api/v1/spaces/{spaceId}` (`space.settings.write`) for name, slug (409 on a taken slug; the old slug doesn't redirect, so warn), country, timezone and work week;
  - the "General" settings section becomes editable.
- **Done when:** a new workspace stores all three; the Owner can edit them; Admin and Member get 403; the slug change moves the URL.

### WH-063 · Public and company holidays
- **Type:** feature · **Priority:** P1 · **Status:** start · **Area:** api + client + database
- **Blocked by:** WH-056
- **Why:** FR-HOL-01/02 + FR-SPC-03 (seed the country's holidays at creation).
- **Scope:** import public holidays by country and year (pick a data source: a bundled dataset or an API, recorded here); custom company holidays (`holidays.write`); list and calendar views; "Holidays" replaces its placeholder.
- **Done when:** a Moroccan workspace gets its 2026 public holidays on creation; an Admin adds a company day; both count in WH-061's day calculation.

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
- **Scope:** `MailService` templates per locale (`en`, `fr`, `ar`, with RTL in the HTML for Arabic). The user's `locale` picks the template. Includes the verification email language AC moved from WH-032.

### WH-055 · Error pages: `error.tsx` and `global-error.tsx`
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** client
- **Why:** a rendering crash today shows Next's default error screen (English, unstyled). WH-051 left this out of scope.
- **Scope:**
  - `app/[locale]/error.tsx` (client): a translated "Something went wrong" inside the shell, with "Try again" (`reset()`) and "Go to dashboard"; log the error digest;
  - `app/global-error.tsx`: its own `<html><body>`, minimal, for errors in the root layout;
  - the same look as the 404 page (shared empty-state component).
- **Done when:** a test page that throws shows the translated error page in `en`, `fr` and `ar`; "Try again" re-renders; no stack traces are shown to users.

### WH-060 · Leave types and the balance ledger
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client + database + worker
- **Why:** FR-LVB-01..05 + FR-SPC-03. Balances are the base of every leave screen. Split into DB / API / UI / worker tickets when it starts.
- **Scope:**
  - leave types: name, colour, paid/unpaid, yearly allowance, accrual (upfront/monthly), carry-over, allow-negative;
  - default types seeded when a workspace is created;
  - balances as an **append-only ledger** (`balance_entries`), where balance = sum;
  - adjustments with a mandatory reason (`balances.adjust`);
  - a worker for monthly accrual and year-end carry-over in the workspace timezone (WH-056);
  - "Leave policies" replaces its placeholder.
- **Done when:** a member's allowance, taken, pending and remaining per type match the ledger; an adjustment without a reason gets 400.

### WH-061 · Leave requests
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client + database
- **Blocked by:** WH-060, WH-056, WH-063
- **Why:** FR-LVR-01..05, the core flow of the product.
- **Scope:**
  - request: type, start/end, half days, reason, optional attachment (private storage, see WH-065);
  - working days exclude weekends (work week) and holidays;
  - overlaps are blocked;
  - an insufficient balance warns, or blocks when the type disallows negative;
  - cancelling a pending request; cancelling an approved one needs approval;
  - "My leave" replaces its placeholder.
  - **From WH-046:** `DELETE …/members/:id` hard-deletes the membership. Once leave or document history references memberships (FR-MEM-05), removal must keep history — soft-remove or `ON DELETE RESTRICT`, not a hard delete.
- **Done when:** the day count matches FR-LVR-02 for a range spanning a weekend and a holiday; overlap and negative-balance cases are tested.
- **Constraint (from WH-046):** `DELETE /spaces/{id}/members/{membershipId}` hard-deletes the membership today. Before leave requests reference memberships, switch removal to keep history (FR-MEM-05): a soft `removed` status, or `ON DELETE RESTRICT` with a clear 409.

### WH-062 · Approvals inbox, comments and audit log
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client + database
- **Blocked by:** WH-061, WH-058
- **Why:** FR-APR-01..06.
- **Scope:**
  - an inbox filterable by team, type and date (`leave.approve` / `documents.fulfil`);
  - approve or deny, with a comment required on denial;
  - you can't approve your own request; managers' requests fall back to Owner/Admin;
  - a comment thread on each request;
  - an **immutable audit log** (actor, time, from → to);
  - approval writes the ledger deduction **in the same transaction**;
  - "Approvals" replaces its placeholder.
- **Done when:** the median path request → decision works end to end; the audit log can't be updated or deleted by the app role (DB grant + test).

### WH-064 · Team calendar and leave bank
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** client + api
- **Blocked by:** WH-061
- **Why:** FR-LVB-06: everyone sees who is off, with the exact leave type ("Team leave bank and calendar" for all roles in the PRD).
- **Scope:** month/week calendar of approved (and optionally pending) leave plus holidays, filterable by team; the team leave-bank table; "Team calendar" replaces its placeholder; RTL-correct calendar.
- **Done when:** two members' approved leave appears on the right days, in all 3 languages.

### WH-065 · Document requests ("papers")
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client + database + infra
- **Why:** FR-DOC-01..04.
- **Scope:**
  - document types (name, description, turnaround, fulfilment role);
  - a member's request (purpose, language, delivery);
  - HR moves it through Pending → In progress → Ready (file uploaded) / Rejected (comment required);
  - download through a **signed URL valid 10 minutes**.
  - ⚠️ These files are **private**: use a **separate private bucket** (or a private prefix with no anonymous policy), never the public-read branding bucket from WH-047.
  - "Documents" replaces its placeholder.
- **Done when:** a ready document downloads with a signed URL that expires after 10 min; anonymous access to the private bucket → 403.

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
- **Re-check (2026-10-17):** partly done. README "Local development" now has `docker compose --env-file … up -d`, `pnpm install`, `migrate deploy`, `pnpm db:seed`, `pnpm dev`, and the MinIO notes. Still missing:
  - [ ] Node 22 (`nvm use`, `nvm alias default 22`; the hooks and pnpm still run on Node 20 by default);
  - [ ] the seed accounts (`owner@`/`admin@`/`member@`/`unverified@workhub.test`, password from the seed) and the Acme workspace;
  - [ ] URLs: Mailpit `:8025`, Swagger `:3333/docs`, Adminer `:8083`, MinIO console `:9001`;
  - [ ] `pnpm dev:reset`, `pnpm backlog`, `pnpm nx e2e @work-hub/client-e2e`, `pnpm db:seed -- --reset`;
  - [ ] the stale sections: "Stack (planned)", "Planned monorepo layout" (point to `docs/architecture.md`), and "Status: Greenfield".


### WH-054 · Upload follow-ups (from the WH-047/WH-050 reviews)
- **Type:** tech-debt · **Priority:** P3 · **Status:** start · **Area:** api + infra
- **Why:** three small leftovers noted when WH-047 and WH-050 were closed in `d39d25a`.
- **Scope:**
  - [ ] Delete `libs/api/auth/src/strip-client-image.ts`, its spec, and the `databaseHooks.user.update.before` that uses it. It can't work: Better Auth merges hook results (`{...actualData, ...result.data}`), so omitting `image` changes nothing. The route-level `hooks.before` on `/update-user` (400 when `image` is sent) is the real guard and has its own test.
  - [ ] A pixel-bomb upload answers 415 `IMAGE_UNSUPPORTED_TYPE`. **Also a test gap since `e9608e2` (WH-077):** the spec's header-only PNG fails to decode with or without `limitInputPixels`, so it passes even if the limit is removed. Once the pixel-limit error has its own code, assert that code (and make the fixture's IHDR exactly 1 pixel over the limit). Map sharp's "exceeds pixel limit" error to 413 `IMAGE_TOO_LARGE` (or a new `IMAGE_DIMENSIONS_TOO_LARGE`) so the client can show "image too large".
  - [ ] The bucket name `workhub` is hard-coded in `docker-compose.yml` and `docker/minio/anonymous-get-object.json`, while the API reads `STORAGE_BUCKET`. Either derive both from `STORAGE_BUCKET` (render the policy with `sed` in `minio-init`) or document that they must match.

### WH-057 · Transfer ownership, archive and delete a workspace
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** api + client
- **Why:** FR-SPC-04. The settings "Danger zone" is a placeholder.
- **Scope:** transfer to another active member (both confirm); archive (read-only); delete = soft delete (`deleted_at`), with a purge after 30 days by a worker; confirmation by typing the slug; storage files deleted on purge.
- **Done when:** each action is Owner-only, audited, and reversible where the SRS says so.

### WH-059 · Join by verified company email domain
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** api + client
- **Why:** FR-MEM-03/04 + FR-AUTH-02, the third way to join in the PRD.
- **Scope:** Admins add a domain and verify it by DNS TXT or an admin-mailbox code; verified sign-ups from that domain join with the default role; public domains (gmail.com…) are rejected.
- **Done when:** a verified `@acme.test` sign-up lands in Acme as Member; `@gmail.com` can't be added.

### WH-066 · Notifications (in-app + email) and preferences
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** api + client + worker
- **Why:** FR-NTF-01/02. The bell and `/settings/notifications` are placeholders.
- **Scope:** events (invite, new request → approvers, decision, comment, document ready); an in-app list with an unread badge on the bell; email through the mail lib in the user's language (WH-013); per-event/channel preferences.
- **Done when:** a decision on a request notifies the requester in-app and by email, respecting preferences.

### WH-067 · Employee profiles
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** api + client + database
- **Why:** FR-PRF-01..03 ("Profiles" in the PRD scope).
- **Scope:** personal fields (member-editable) and employment fields (admin-editable) per workspace; restricted fields (national ID, salary-related) visible only to the member, admins and owner; request history; export personal data as JSON; the profile page reachable from People.
- **Done when:** a member can't read another member's restricted fields (API test); export returns the member's data only.

### WH-068 · Sessions page: see and sign out other devices
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** client
- **Why:** `/settings/sessions` is a placeholder; Better Auth already has `listSessions`, `revokeSession` and `revokeOtherSessions`.
- **Scope:** list the current user's sessions (device/browser from the user agent, IP, last active, "this device"); revoke one, or all others.
- **Done when:** revoking another session signs that browser out on its next request.

### WH-070 · Optional two-factor authentication (TOTP)
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** api + client
- **Why:** FR-AUTH-04 ("should"). Better Auth has a `twoFactor` plugin.
- **Scope:** enable/disable with a QR code + backup codes in settings; a TOTP step at sign-in; recovery with a backup code.
- **Done when:** a user with 2FA can't sign in without the code, and can with a backup code once.

### WH-071 · Billing per workspace (deferred)
- **Type:** feature · **Priority:** P3 · **Status:** start · **Area:** api + client
- **Why:** FR-BIL-01/02: monthly price from active memberships, prorated; only the Owner manages it. Deferred with deployment (WH-026); the settings "Billing" section is a placeholder.
- **Done when:** decided and specified (provider, plans) before any implementation.
