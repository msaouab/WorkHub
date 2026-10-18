# WorkHub Backlog

The single list of planned work, bugs and tech debt. Tickets are **sorted by priority, then status** (P0 first; within a priority: start → in progress → under-review). Finished tickets are deleted; their history is in git.
Update it in the same commit as the work.

_Last updated: 2026-10-18_

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

**Quality pipeline and commit gate:** `pnpm quality` runs every check and prints a summary:
1. the backlog rules;
2. `nx sync:check`;
3. typecheck, lint and test for all projects (lint includes **no hard-coded UI text**, via `react/jsx-no-literals`, and the module-boundary rules);
4. **knip** for unused files, exports and dependencies;
5. **unused translation keys**.

The git **pre-commit hook** (`.githooks/pre-commit`, enabled by `pnpm install`) runs `pnpm quality --gate`, which also enforces the team rule: **you can commit only when no ticket is `in progress` and every `under-review` ticket has been reviewed** (Claude records reviews with `pnpm backlog --mark-reviewed`). A ticket you started but won't finish before the commit goes back to `start`. Bypassing with `git commit --no-verify` is for emergencies only.

Run `pnpm backlog` yourself to see the review queue (`⟳ needs review` marks what's pending) and every ticket by priority. It also catches format mistakes: unknown or `done` status, duplicate ID, wrong order, stale tracker.

**Ticket ID:** `WH-###`, never reused (not even after a ticket is deleted). New tickets take the next free number: **next free is WH-076**.
**Priority:** **P0** broken or insecure, fix first · **P1** current milestone · **P2** planned · **P3** nice to have / cleanup.
**Type:** `feature` · `bug` · `security` · `tech-debt` · `chore`

**Ticket format:**
- **Why**, **Scope**, **Acceptance criteria**;
- once work starts: dated **Progress** notes;
- after each review: a dated **Review** entry.
- **Blocked by** names a ticket that must be done first; **Depends on** is softer, "easier after".

**Roadmap (one feature at a time, backend and frontend together):**
1. ~~Login UI + frontend foundation~~ · ~~workspaces, roles, memberships + isolation~~ · ~~app shell~~ · ~~members~~ (done)
2. **Invites + the Team page** (WH-010, WH-073), with the quality gate (WH-074, WH-075). **Current milestone**
3. Permissions management (WH-011), then teams/groups and the Manager role (WH-058)
4. Workspace setup and holidays (WH-056, WH-063), then leave (WH-060 → WH-061 → WH-062 → WH-064)
5. Documents (WH-065), notifications and emails in the user's language (WH-066, WH-013)
6. OAuth sign-in (WH-012), profiles, sessions, 2FA; CI (WH-069) as early as possible

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
| WH-073 | 2026-10-18 | 2026-10-18 | ready | commit |
| WH-074 | 2026-10-18 | 2026-10-18 | ready | commit |
| WH-075 | 2026-10-18 | 2026-10-18 | ready | commit |

## Tickets

Sorted by **priority** (P0 → P3), then by **status** (`start` → `in progress` → `under-review`), then by planned order. Done tickets are deleted.

### WH-074 · Fix the first quality-pipeline findings (unused code, deps and translation keys)
- **Type:** tech-debt · **Priority:** P1 · **Status:** under-review · **Area:** client + api + tooling
- **Why:** the first run of `pnpm quality` (WH-075, 2026-10-18) passes typecheck, lint and tests, but fails two checks. The commit gate blocks commits until they pass. Each item was checked by hand; false positives are already excluded in `knip.json`.
- **Scope:**
  - [x] **Unused dependencies:** `@aws-sdk/client-s3` and `sharp` in `libs/api/spaces/package.json`. Image processing moved to `libs/api/storage` (WH-047), which declares both. Remove them from `spaces`.
  - [x] **Duplicate devDependency:** `@types/react-dom` in the root `package.json`. Check whether the web app needs it; if so, declare it in `apps/client/package.json`, otherwise remove it.
  - [x] **Dead code:** `callbackLocale()` (`lib/auth-proxy.ts:113`) and `isCoverPreset()` (`lib/cover-presets.ts:15`). Delete them (and any spec that only tests them).
  - [x] **Unused exports:** `redirect` and `getPathname` from `i18n/navigation.ts` (only export what's used), the `LandingStat` type (`content/landing-structure.ts`) and the `AppRoute` type (`lib/routes.ts`). Un-export, or delete if unused internally.
  - [x] **23 unused translation keys**, left over from the People/Invites/AppHome rewrites. Delete each from **all three** message files (`en`, `fr`, `ar`), keeping them in sync:
    - `Metadata.spaceMembersTitle`, `Metadata.spaceMembersDescription`, `Metadata.spacePeopleTitle`, `Metadata.spaceInvitesTitle`, `Metadata.spaceTeamsTitle`;
    - `Dashboard.requestsSoon`, `Common.unavailable`, `Site.nav.contact`;
    - `Auth.appShell.emailVerified`, `Auth.appShell.yes`, `Auth.appShell.no`;
    - `Spaces.invites.emailTitle`, `Spaces.invites.emailPlaceholder`, `Spaces.invites.sendEmail`, `Spaces.invites.linkTitle`, `Spaces.invites.listTitle`, `Spaces.invites.columns.uses`;
    - `Spaces.create.invalid`, `Spaces.settings.noAccess`, `Spaces.settings.back`, `Spaces.settings.backToSpace`;
    - `Validation.invalidInput`, `Team.invitations.copyUnavailable`.

    Before deleting one, make sure it isn't read dynamically (`t(variable)`); if it is, add its prefix to `DYNAMIC_MESSAGE_PREFIXES` in `tools/quality/src/cli.mjs` instead.
  - [x] Minor: the landing hero image is a hot-linked Unsplash URL (`content/landing-structure.ts:32`). Move it to `apps/client/public/` (local, cacheable, and no third-party request on the home page).
- **Done when:** `pnpm quality` prints "✓ All checks passed".
- **Progress (2026-10-18):** Cleared knip/i18n findings; hero is local (`/hero-office.jpg`); `pnpm quality` prints "✓ All checks passed".
- **Review (2026-10-18):** ✅ verified:
  - `sharp` and `@aws-sdk/client-s3` are gone from `libs/api/spaces`;
  - `@types/react-dom` moved to `apps/client/package.json`;
  - `callbackLocale()` and `isCoverPreset()` are deleted;
  - `i18n/navigation.ts` exports only `Link`, `usePathname`, `useRouter`; the unused types are un-exported;
  - the message files are in sync at **506 keys each** (was 530);
  - the hero image is local (`public/hero-office.jpg`, `/hero-office.jpg`), and Unsplash is removed from `remotePatterns`;
  - `pnpm quality`: knip ✓, translation keys ✓, typecheck/lint/test ✓. **Ready to commit.**

### WH-075 · Quality pipeline and commit gate (`pnpm quality`)
- **Type:** chore · **Priority:** P1 · **Status:** under-review · **Area:** tooling
- **Why:** reviews kept finding the same kinds of problems by hand: dead code, leftover dependencies, unused translations, hard-coded text, lint left failing, and commits made while work was half done. The team rule is now: **commit only when every ticket we worked on is done**.
- **What was built (2026-10-18, by Claude):**
  - `tools/quality` (`@work-hub/quality`, `type:tool`) with `pnpm quality` [`--gate`]. Its steps: backlog rules; the commit gate; `nx sync:check`; `nx run-many -t typecheck lint test`; **knip** (pinned `5.88.1`, config in `knip.json` with the false positives documented: runtime-only server deps, root-level devDeps, generated Prisma client, vendored `components/ui`); unused translation keys (a heuristic: a key counts as used if its leaf is quoted or its parent is read with `${…}`; `Locale.*` is allowlisted because it's read with a variable). It prints a ✓ / ! / ✗ summary and exits 1 on failure.
  - The **commit gate** (`gateProblems()`): no ticket `in progress`, and no `under-review` ticket pending review (reuses `pendingReviews()` and the review state from `@work-hub/backlog`, which now exports its API).
  - The **git pre-commit hook** `.githooks/pre-commit` → `pnpm -s quality --gate`; the root `prepare` script sets `core.hooksPath` on `pnpm install`.
  - **No hard-coded UI text:** `react/jsx-no-literals` in `apps/client/eslint.config.mjs` (props ignored; punctuation allowed). The one exception is `app/not-found.tsx` (outside `[locale]`, English by design, WH-051), with a documented `eslint-disable`.
  - Module boundaries: `type:tool` may now depend on `type:tool` (`docs/architecture.md` updated).
  - Unit tests: `tools/quality/src/checks.test.mjs` (6).
- **Acceptance criteria:**
  - [x] `pnpm quality` runs all 6 steps and shows a summary; typecheck, lint and test are green with the new rule.
  - [x] `git commit` runs the gate; it fails while any ticket is `in progress` or an under-review ticket isn't reviewed.
  - [x] Every false positive excluded in `knip.json` was checked by hand (see WH-074 for the real findings).
  - [ ] When CI exists (WH-069), run `pnpm quality` there too (without `--gate`, which depends on the local review state).

### WH-011 · Permissions management
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client
- **Why:** your original requirement. Workspace admins set what each member can do and can change anyone's role.
- **Scope:**
  - change a member's role;
  - custom roles;
  - safety rules (you can't give permissions you don't have, can't change your own role, the owner role is locked);
  - UI: members and roles settings;
  - hook WH-019.
- **Depends on:** WH-009 (done in `d39d25a`).
- **UI rule (from WH-019, hook done in `d395684`):** "Change role" / role editing render only when `useCan(PERMISSIONS.ROLES_WRITE)`; the API still returns 403.


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

### WH-056 · Workspace setup: country, timezone, work week; edit name and slug
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client + database
- **Why:** FR-SPC-01 requires a workspace to have a **country, timezone and work week**. Leave days (FR-LVR-02), accruals (FR-LVB-03) and public holidays (FR-HOL-01) all depend on them, and today a workspace only has a name and slug. The settings page also says "editing the name and slug will be available soon".
- **Scope:**
  - columns `country` (ISO 3166-1 alpha-2), `timezone` (IANA), `work_week` (e.g. `{mon..fri}`), with a migration and defaults for existing rows;
  - the create form asks for country (prefilled from the browser locale) and timezone (prefilled from `Intl`), plus the work-week preset;
  - `PATCH /api/v1/spaces/{spaceId}` (`space.settings.write`) for name, slug (409 on a taken slug; the old slug doesn't redirect, so warn), country, timezone and work week;
  - the "General" settings section becomes editable.
- **Done when:** a new workspace stores all three; the Owner can edit them; Admin and Member get 403; the slug change moves the URL.

### WH-058 · Teams and the Manager role
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client + database
- **Why:** the PRD has four roles (Owner, Admin/HR, **Manager**, Employee) and FR-MEM-05/06 need teams with one or more managers who approve their team's leave. The code only has Owner, Admin and Member presets and no teams. Approvals (WH-062) can't route without this.
- **Scope:**
  - a `Manager` system role preset (`leave.approve`, optional `documents.fulfil`, `calendar.read`, …);
  - `teams` + `team_members` + `team_managers` tables with RLS;
  - CRUD under `teams.write`;
  - assign a member's team and manager (FR-MEM-05);
  - the "Teams" page replaces its placeholder.
- **Done when:** an Admin creates a team, adds members and managers; a manager sees only their teams' requests (once WH-062 exists).
- **UI placement (2026-10-17, see WH-073):** teams appear as a **"Groups" tab inside the Team page**, not as a separate sidebar item. The user-facing word "Team" now means the whole workspace roster, so use "Groups" in the UI (keep `teams` as the table and permission name: `teams.write`).

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

### WH-063 · Public and company holidays
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api + client + database
- **Blocked by:** WH-056
- **Why:** FR-HOL-01/02 + FR-SPC-03 (seed the country's holidays at creation).
- **Scope:** import public holidays by country and year (pick a data source: a bundled dataset or an API, recorded here); custom company holidays (`holidays.write`); list and calendar views; "Holidays" replaces its placeholder.
- **Done when:** a Moroccan workspace gets its 2026 public holidays on creation; an Admin adds a company day; both count in WH-061's day calculation.

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

### WH-069 · CI: run the checks on every push and pull request
- **Type:** chore · **Priority:** P2 · **Status:** start · **Area:** tooling
- **Why:** there is **no `.github/` folder**: nothing runs `typecheck/lint/test`, the integration tests or e2e except by hand (SRS §9). Reviews have caught lint failures that a pipeline would have blocked.
- **Scope:** GitHub Actions on Node 22 + pnpm cache:
  - `pnpm nx affected -t typecheck lint test` (with a `nx sync:check` step);
  - a Postgres 16 service for the `*.integration.spec.ts` files (migrate deploy first);
  - Playwright e2e against built apps, with Mailpit + MinIO services;
  - `pnpm backlog` must print ✓.
- **Done when:** a PR that breaks lint, a test or an RLS integration test shows a red check.

### WH-072 · E2E stability: sign in once per role, not through the form in every test
- **Type:** tech-debt · **Priority:** P2 · **Status:** start · **Area:** tooling (e2e)
- **Why:** found while reviewing WH-053 (2026-10-17). Three runs of `pnpm nx e2e @work-hub/client-e2e` against `pnpm dev` gave three different results: 5 passed / 2 failed (`toHaveURL` after sign-in, `ERR_ABORTED`), then 3 passed / 4 timed out, then the API on `:3333` was down. Causes:
  - **Sign-in rate limit.** `app-shell.spec.ts` signs in through the form in each test (owner, member, admin), and the sign-up test adds more. Better Auth allows **5 sign-ins per minute**, and on localhost every request shares one key (`no-trusted-ip`), so a full run (plus any manual sign-in) hits 429 and `signIn()` never reaches `/dashboard`.
  - **Load.** Playwright runs tests in parallel against a single `next dev`; with compiles on first visit, `page.goto` exceeded 90 s at load average about 18.
- **Scope:**
  - [ ] A Playwright **setup project** signs in once per seed role (owner, admin, member) through the API (`POST /api/auth/sign-in/email`) and saves `storageState` to `playwright/.auth/{role}.json` (gitignored). Tests use `test.use({ storageState })` instead of `signIn()`. One test still covers the real sign-in form.
  - [ ] `workers: 1` when `reuseExistingServer` hits a dev server (keep parallel in CI against built apps, WH-069).
  - [ ] When the API isn't reachable, fail fast with a clear message ("start `pnpm dev` first") instead of trying to launch a second `nx serve server` next to `pnpm dev`.
- **Done when:** three consecutive `pnpm nx e2e @work-hub/client-e2e` runs pass against a running `pnpm dev`, with no 429s in the API log.
  - [ ] Add the Team e2e test (from WH-073): Owner invites by email → the pending row appears with its badge → revoke → the preview answers "revoked". Uses the Owner storage state.

### WH-073 · Team page: one place for members and invitations
- **Type:** feature · **Priority:** P2 · **Status:** under-review · **Area:** client
- **Why:** members (WH-046) and invites (WH-010) are two sidebar items and two pages today, so you invite people on one page and then go elsewhere to see them. People think of this as one job: *who's in my workspace, and who's coming*. GitHub (People + Invitations), Linear, Slack and Notion (Members + Groups) all put it on one page with tabs.
- **Naming:** sidebar label **"Team"** (singular: the whole workspace roster). The groups feature (WH-058, `teams` table) is shown as **"Groups"** inside this page, so "Team" and "teams" never mean two things in the UI.
- **Design** (mockup 2026-10-17):
  - **Route:** `/{locale}/s/{slug}/team`, with tabs as query params so they're shareable and survive a reload: `?tab=members` (default), `?tab=invitations`, `?tab=groups`. 308 redirects from `/people` and `/invites` (`/invites` → `?tab=invitations`).
  - **Header:** title "Team", one line ("Everyone in {workspace}, and who's been invited"), and the **one primary action**, "Invite people", top-right (shown with `invites.write`). It opens the invite dialog from any tab.
  - **Members tab** (the current People list, moved as is): search (debounced), filters for role and status (Active / Deactivated / All), and rows with avatar, name, "(you)", email, role and status pills, plus a "…" menu (Deactivate / Reactivate / Remove; Leave on your own row; hidden for the last Owner). A count in the tab label.
  - **Invitations tab** (`invites.write` only, otherwise the tab is hidden): one list for email and link invites.
    - Email rows: address, role, "invited by", "expires in N days", with **Resend** and **Revoke**.
    - Link rows: role, "N of M uses", expiry, with **Copy link** and **Revoke**.
    - Expired, revoked and used-up invites go under a collapsed "Past invitations" section, and expired ones get **Resend** (creates a fresh invite).
    - A badge with the pending count in the tab label.
  - **Groups tab:** a "coming soon" panel until WH-058 ships, then teams with their managers and members.
  - **Invite dialog** (Base UI `Dialog`), with a segmented control at the top:
    - **By email:** a chip input. Paste or type several addresses (comma, space or newline separated); invalid ones turn red with an inline error and are skipped; duplicates and existing members are flagged before sending. One **Role** select (default: the workspace's default role; no Owner; only roles the inviter can grant once WH-011 exists). Button "Send N invitations". The result shows sent / already a member / failed per address, from the per-address results.
    - **Share a link:** role, expiry (1, 7 or 30 days), max uses (1–100), then **Create link** → the URL in a read-only field with **Copy** (and a "Copied" toast). The token is shown once; the list later shows the link without the token unless re-copied right after creation.
  - **Empty states:** no pending invites → "Invite your team" with the primary button; a search with no match → "No one matches '{q}'".
- **Sidebar** (`space-nav.ts`): replace **People** and **Invites** with one **Team** item (`users` icon, visible with `members.read`) in *main*. Remove the separate **Teams** item from *Manage* (it becomes the Groups tab). The sidebar gets 2 items shorter.
- **API needs:**
  - a bulk email invite, `POST /spaces/{id}/invites` with `emails: string[]` (max 50 per request, FR-MEM-02 later allows CSV up to 500), returning a per-address result (`created` / `already_member` / `already_invited` / `invalid`);
  - `POST /invites/{id}/resend` (new token, new expiry; the old one revoked);
  - both under `invites.write`, plus tests.
- **Text, RTL, accessibility:**
  - `Team.*` keys in `en`, `fr` and `ar`;
  - the tabs use `role="tablist"`, arrow-key navigation and `aria-selected`;
  - the chip input is keyboard-editable (Backspace removes the last chip), each chip has a remove button labelled "Remove {email}", and email chips stay `dir="ltr"` inside RTL;
  - "Copied" is announced (`aria-live`).
- **Acceptance criteria:**
  - [x] One "Team" item in the sidebar; `/people` and `/invites` redirect (308) to the right tab.
  - [x] Bulk email create returns per-address results; invite dialog + chip parser (unit-tested).
  - [x] Creating a link shows Copy with `aria-live` "Copied"; Resend/Revoke on invitations; past section collapsed.
  - [x] A Member sees the Members tab only: no "Invite people" button and no Invitations tab.
  - [x] Tabs use `?tab=` (survive reload) and keyboard arrows; `Team.*` in en/fr/ar; email chips `dir="ltr"`.
  - [x] e2e: invite-by-email → pending → revoke (**blocked by WH-072** — do not invent a flaky form-based e2e now). _(moved to WH-072, 2026-10-18)_
- **Progress (2026-10-18):** Team page at `/s/{slug}/team` with members/invitations/groups tabs; API bulk email, resend, list `status` + `createdBy`, `GET /roles`; nav collapsed to Team; 308 from `/people`, `/invites`, `/teams`.
- **Depends on:** WH-010 (done in `d9b04ab`), WH-046 (done in `d67afda`). **Feeds:** WH-058 (Groups tab), WH-011 (role options in the dialog).
- **Review (2026-10-18):** 🔁 well built; four fixes. Verified in code and tests:
  - `/s/{slug}/team` with `?tab=members|invitations|groups`; `/people`, `/invites` and `/teams` redirect permanently to the right tab;
  - the sidebar has one **Team** item (People, Invites and Teams removed);
  - `TeamMembers` / `TeamInvitations` / `InvitePeopleDialog`; the roles list excludes Owner;
  - bulk `emails` (max 50) with per-address results; `POST /invites/{id}/resend` (revokes the old invite, new token, 7 days);
  - tabs with `role="tablist"`, `aria-selected` and arrow keys; the chip input with Backspace, "Remove {email}" labels and `dir="ltr"`; "Copied" announced with `aria-live`;
  - `parse-invite-emails.spec` (3) and `space-nav.spec` (6); all 16 projects pass.
  - [x] 🔴 **The dialog pre-selects "Admin".** `GET /roles` now returns `isDefault`; the dialog selects the workspace default role.
  - [x] **No stricter rate limit on sending invites.** `@Throttle` 10/min on create and resend; per-workspace daily cap of 500 email invites (UTC day) → 429 `RATE_LIMITED`.
  - [x] **Arrow keys in RTL.** Tab delta flips with `useDirection()` so ArrowLeft advances in `ar`.
  - [x] `/members` redirects straight to `/team?tab=members` in `next.config.js` (no `/people` hop).
  - [x] Missing AC: the e2e test "invite by email → pending row → revoke" (blocked by WH-072's per-role sign-in). _(moved to WH-072, 2026-10-18)_
  - [x] Browser check (API up): Owner sees Invite dialog (By email / Share a link); `?tab=invitations` survives reload; Member sees Members + Groups only (no Invite button, no Invitations tab). Phone/`ar` full-screen not re-checked this pass.
- **Progress (2026-10-18):** Review fixes for default role, invite rate limits, RTL tabs, and `/members` redirect.
  - Note: the contract uses `emails: z.array(z.email())`, so one bad address rejects the whole request with 400, and the server's per-address `invalid` result can't happen. Fine while the dialog filters invalid chips first; either accept `z.string()` and report `invalid` per address, or drop that status.
- **Progress (2026-10-18):** Browser sanity on Acme; e2e left open for WH-072; ticket moved to under-review.
- **Review (2026-10-18, 2nd pass):** ✅ all feedback fixed:
  - `pnpm quality` passes every check;
  - **default role** = `isDefault` from `GET /spaces/{id}/roles` (live: Admin, **Member\***), and the dialog pre-selects Member ("عضو");
  - **sending limit:** `@Throttle` 10/min on create and resend (live: the 11th create → **429**), plus a per-workspace daily email cap (`assertEmailInviteBudget`, with a unit test);
  - **RTL tabs:** in `ar`, ArrowLeft moves to the next tab and updates `?tab=`;
  - `/members` → 308 straight to `/team?tab=members`.
  - **Browser checks:** `?tab=invitations` opens on that tab after a reload; at 375 px there's no horizontal overflow and the dialog opens in RTL at 343 px (the screen minus margins, not edge-to-edge full-screen, which is fine); a **Member** sees only the Members and Groups tabs, with no "Invite people" button, even on `?tab=invitations`.
  - The e2e test moved to WH-072 (it needs the per-role sign-in).
  - Minor, not blocking: a Member on `?tab=invitations` keeps that query in the URL while seeing Members; consider normalising it to `?tab=members`.
  - **Ready to commit.**

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
  - [ ] A pixel-bomb upload answers 415 `IMAGE_UNSUPPORTED_TYPE`. Map sharp's "exceeds pixel limit" error to 413 `IMAGE_TOO_LARGE` (or a new `IMAGE_DIMENSIONS_TOO_LARGE`) so the client can show "image too large".
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
