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
1. Check every acceptance criterion and the Definition of Done: read the code, run `pnpm quality`, and check the running app for user-facing work.
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

**Ticket ID:** `WH-###`, never reused (not even after a ticket is deleted). New tickets take the next free number: **next free is WH-079**.
**Priority:** **P0** broken or insecure, fix first · **P1** current milestone · **P2** planned · **P3** nice to have / cleanup.
**Type:** `feature` · `bug` · `security` · `tech-debt` · `chore`

**Ticket format:**
- **Why**, **Scope**, **Acceptance criteria**;
- once work starts: dated **Progress** notes;
- after each review: a dated **Review** entry.
- **Blocked by** names a ticket that must be done first; **Depends on** is softer, "easier after".

**Roadmap (one feature at a time, backend and frontend together):**
1. ~~Login UI + frontend foundation~~ · ~~workspaces, roles, memberships + isolation~~ · ~~app shell~~ · ~~members~~ (done)
2. ~~Invites + the Team page + quality gate~~ (done in `d9b04ab`, `8ded723`)
2b. **Foundations: reliable e2e (WH-072) + CI (WH-069).** **Current milestone**
3. **Permissions management (WH-011), next**, then teams/groups and the Manager role (WH-058)
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

## Tickets

Sorted by **priority** (P0 → P3), then by **status** (`start` → `in progress` → `under-review`), then by planned order. Done tickets are deleted.

### WH-011 · Permissions management
- **Type:** feature · **Priority:** P1 · **Status:** done · **Area:** api + client
- **Why:** your original requirement. Workspace admins set what each member can do and can change anyone's role.
- **Scope:**
  - change a member's role;
  - custom roles;
  - safety rules (you can't give permissions you don't have, can't change your own role, the owner role is locked);
  - UI: members and roles settings;
  - hook WH-019.
- **Depends on:** WH-009 (done in `d39d25a`).
- **UI rule (from WH-019, hook done in `d395684`):** "Change role" / role editing render only when `useCan(PERMISSIONS.ROLES_WRITE)`; the API still returns 403.
- **Plan (2026-10-18), next after WH-072/WH-069.** Split when started:
  1. **API: change a member's role.** `PATCH /spaces/{id}/members/{membershipId}` `{ roleId }` (`roles.write`). Rules:
     - you can't change your own role;
     - nobody can change the Owner's role, or make someone Owner (that's ownership transfer, WH-057);
     - you can only grant a role whose permissions are a **subset of your own** (no escalation).
  2. **API: custom roles.** `GET/POST/PATCH/DELETE /spaces/{id}/roles`. A name plus permissions from `PERMISSIONS`; system roles can't be renamed or deleted (Owner permissions locked; Admin/Member permissions editable); deleting a role in use → 409 `ROLE_IN_USE`; set the default role via `isDefault`.
  3. **UI:** a role select per row in Team → Members (`useCan(ROLES_WRITE)`); the **Roles and permissions** page replaces its placeholder (a list of roles, plus an editor with permission checkboxes grouped by area and a "used by N members" count); the invite dialog lists custom roles automatically.
  - Tests: an escalation attempt → 403; self-change → 403; Owner untouchable; cross-workspace role id → 404; RLS on roles writes.
- **Progress (2026-10-18):**
  - API: `PATCH …/members/:id` (no self-change, Owner locked, no escalation).
  - API: `GET/POST/PATCH/DELETE …/roles` — custom roles; Owner permissions locked; Admin/Member permissions editable; system roles not renamed/deleted; `ROLE_IN_USE` / default-role guards; RLS covered in integration tests.
  - UI: Team role picker (`ROLES_WRITE`); Roles and permissions page (list + permission editor + default + delete); invite dialog filters Owner and lists custom roles.
  - Tests: members + roles unit/integration (escalation, Owner, cross-workspace 404, RLS write).
- **Progress (2026-10-18, review fixes):** invite/resend grantable-role checks; manage only members/roles ⊆ actor (incl. deactivate/remove); block editing own role; case-insensitive reserved names; unknown perms via Zod only. Spaces tests 58/58 green. API restarted for browser check.
- **Progress (2026-10-18):** custom permission templates capped at **3** per workspace (`MAX_CUSTOM_ROLES` / `ROLE_LIMIT_REACHED`); Owner/Admin via `roles.write`. UI shows count and disables create at the limit.
- **Review (2026-10-18):** 🔁 well built, but there are **two privilege-escalation gaps** to close first. Verified:
  - `pnpm quality` is green after a checker fix (see WH-078); the roles integration tests (5) cover CRUD, the Owner lock, escalation on create/update, cross-workspace 404 and `ROLE_IN_USE`, and the members tests cover role changes;
  - `PATCH …/members/:id` (`roles.write`): no self-change (`CANNOT_CHANGE_OWN_ROLE`), the Owner untouchable (`CANNOT_MODIFY_OWNER`), no assigning Owner (`CANNOT_ASSIGN_OWNER`), the **new** role must be ⊆ your permissions (`ROLE_ESCALATION`);
  - roles: the Owner role is locked (`SYSTEM_ROLE_LOCKED`), system roles can't be renamed or deleted, reserved names, unique `(space_id, name)` (DB constraint + check), the default role can't be cleared or deleted, `ROLE_IN_USE` counts members **and** open invites; Admin/Member permissions editable; no new migration needed.
  - [x] 🔴 **Escalation through invites.** `resolveRoleId` / resend now require `permissionsAreSubset` (incl. default role) → 403 `ROLE_ESCALATION`. Unit tests on create + resend. Invite dialog only lists grantable non-Owner roles.
  - [x] 🔴 **Acting on people and roles above you.** `updateRole` / `deactivate` / `remove` / `reactivate` require the **current** role ⊆ actor; `RolesService.update` / `delete` require the same for the role being changed. Tests added.
  - [x] **Editing the role you hold.** `RolesService.update` / `delete` block `access.roleId` with `CANNOT_CHANGE_OWN_ROLE`. Roles UI locks own role and superior roles.
  - [x] Reserved names compared case-insensitively (`owner` / `ADMIN` rejected).
  - [x] Unknown permissions rejected by Zod (`z.enum(PERMISSION_LIST)`); service no longer maps unknowns to `ROLE_ESCALATION`.
  - [x] Browser check: Roles page in `ar` (RTL, permission tree, 0/3 templates, New template); Team page role pickers for Admin/Member, Owner locked as plain text.
- **Review (2026-10-18, 2nd pass):** 🔁 almost done. All the security fixes are verified **live**:
  - an Admin inviting into a custom "Co-owner" role (`space.settings.write`) → **403**;
  - an Admin editing that role → **403**; an Admin editing their own Admin role → **403**;
  - a role named `manager` → **409** (reserved, case-insensitive); an unknown permission → **400** (Zod enum).
  - In code: `assertInviteRoleGrantable` (including the default role), `assertRoleWithinReach` in deactivate, reactivate, remove and role change (current **and** new role), and in role update/delete; own-role edits blocked.
  - `pnpm quality`: code checks green; spaces tests 76/76.
  - [x] **The invite dialog still offers roles the inviter can't grant.** Invite dialog filters with `permissionsAreSubset(role.permissions, actorPermissions)` (same as Team members); if the default isn't grantable, the first grantable role is pre-selected.
  - [x] Browser check: the Team role picker and the Roles page (permission tree, "used by N", default, delete → `ROLE_IN_USE`) in `ar`; confirm Admin no longer sees ungrantable roles in Invite.
- **Progress (2026-10-18, review fixes 3rd pass):** invite dialog grantable-role filter + default fallback.
- **Review (2026-10-18, 3rd pass):** 🔁 the dialog fix is in (`invite-people-dialog.tsx` filters with `permissionsAreSubset(role.permissions, actorPermissions)`). Remaining:
  - [x] The suite is red because of the member-role change shared with WH-058 (see WH-058: the `members.service.ts:350` type error and the `members-api.spec.ts` fixture). WH-011 can't be `done` while `pnpm quality` fails. → fixed under WH-058.
  - [x] Browser check: Team in `ar` (role pickers, RTL); Roles in `ar` (permission tree, 0/3 templates, Manager listed, New template, default badge on Member). Dev restarted 15:56.
- **Review (2026-10-18, final):** ✅ **done.** `pnpm quality` is all green, on a branch rebased onto `e9608e2`. The suite blocker is fixed (shared with WH-058). **Browser, `ar`:** the Roles page (RTL, no English, Admin/Manager/Member\*/Owner with "used by 1 member", a "default" badge, the "0 of 3 custom templates" limit, the permission tree grouped by area with select all/none); the Team members tab with per-row role pickers. All escalation fixes were verified live in the 2nd pass (invite into a higher role → 403, edit a higher role → 403, edit own role → 403, reserved name `manager` → 409, unknown permission → 400).

### WH-077 · Verify CI on GitHub: first green run and a proven red check
- **Type:** chore · **Priority:** P1 · **Status:** done · **Area:** tooling
- **Why:** a workflow is only proven once GitHub runs it. This can't happen inside WH-069, because the push gate only pushes done, committed work.
- **Scope:**
  - [x] Push `main`; the **Quality + integration** and **Playwright e2e** jobs pass on the first run (link the run here).
  - [x] On a throwaway branch with a PR, add a lint error → the check goes red, then delete the branch. Optionally also break an RLS integration test.
  - [x] If a job fails only on GitHub, fix it in a new commit referencing this ticket.
  - [x] Protect `main` with `.github/rulesets/main.json`: GitHub → Settings → Rules → Rulesets → **New ruleset → Import a ruleset** → pick the file → **Create**. Then **delete the old classic branch protection rule** for `main` (Settings → Branches), which is the one demanding 1 approval.
- **Done when:** both jobs are green on `main`, and a red check was seen on a PR.
- **Progress (2026-10-18):** **red check proven.** A PR from `ci-red-check` (a throwaway `const ciRedCheck = 1;` in `apps/client/src/lib/__ci_red_check.ts`) failed **CI / Quality + integration** after about 2 min, on exactly the intended checks: `@work-hub/client:lint` (the unused variable) and knip (the unused file). Backlog, nx sync, typecheck, every test (client 64/64) and the translation keys passed, which proves install, migrations and Postgres work on GitHub. **CI / Playwright e2e** was skipped as designed (`needs: checks`). GitGuardian: no secrets.
  - Found: the `main` protection requires **1 approving review**, and GitHub doesn't allow approving your own PR, so a solo developer is always blocked. Recommended: 0 required approvals for now plus **required status checks** (Quality + integration, Playwright e2e); raise approvals when a second developer joins.
- **Progress (2026-10-18):** decided **pull requests only** for `main`. Added `.github/rulesets/main.json` (deletion + force-push blocked, linear history, PR required with 0 approvals and resolved threads, squash only, required checks `Quality + integration` and `Playwright e2e` from GitHub Actions (`integration_id` 15368) on an up-to-date branch, admin bypass only through the PR merge button). Documented the branch/PR flow in the Workflow section and the README.
- **Progress (2026-10-18):** ruleset `main` active (id 25343016); classic branch protection gone. `ci-red-check` PR closed and remote branch deleted. First `main` run on `2f11d1a` failed on `@work-hub/storage:test` (12k×12k pixel-bomb fixture OOMs under parallel CI). Fix in PR https://github.com/msaouab/WorkHub/pull/3 — **Quality + integration** and **Playwright e2e** both green on the PR. Squash-merge when closing this batch so `main` gets its first full green run.
- **Progress (2026-10-18):** **PR #3, "WH-077: Avoid OOM in storage pixel-bomb test on CI", squash-merged as `e9608e2`.** On GitHub's runners the pixel-bomb fixture (`sharp.create` 12000×12000 → PNG) ran out of memory with the tests in parallel. The test now builds a tiny PNG whose IHDR *claims* √(limit + 1) squared pixels, so sharp's `limitInputPixels` check rejects it from the header without allocating. The merge through a PR (`#3` in the subject) shows the PR flow works.
  - Review note: the new fixture has no IDAT data, so with **or without** `limitInputPixels` sharp fails, and `decode()` maps any failure to `IMAGE_UNSUPPORTED_TYPE`; the test no longer proves the limit exists. Tracked in WH-054 (map "exceeds pixel limit" to `IMAGE_TOO_LARGE`, then assert that code).
  - [x] Confirm on GitHub that the `main` run for `e9608e2` is green for **both** jobs (Quality + integration, Playwright e2e), and whether PR #3 merged with the checks green or through the admin bypass. Link the run here.
- **Progress (2026-10-18):** **first green `main` run.** Squash-merge of PR #3 landed as `e9608e2`. PR checks were already green (Quality + integration + Playwright e2e on run [39134831997](https://github.com/msaouab/WorkHub/actions/runs/39134831997)) — merge was **not** via admin bypass. Push to `main` then ran CI green for both jobs: [39135928970](https://github.com/msaouab/WorkHub/actions/runs/39135928970) (`e9608e2`).

### WH-078 · Workflow: start every next implementation after a commit, not just one
- **Type:** chore · **Priority:** P1 · **Status:** done · **Area:** tooling
- **Why:** after `2f11d1a`, only WH-077 was moved to `in progress`, while the flow says "move the next implementation**s**". WH-011 (the other P1 `start` ticket) was left behind.
- **What changed (by Claude, 2026-10-18):** `nextStartTickets()` now returns **every `start` ticket at the highest remaining priority** (the current milestone), in planned order. The hook says "move the next implementations … : WH-…, WH-…", the Workflow rule 4 says the same, and the test covers several tickets plus the case with no start ticket. WH-011 was moved to `in progress`.
- **Acceptance criteria:**
  - [x] Backlog tests pass (15); `pnpm backlog` ✓.
  - [x] Also fixed: the pre-push hook ran the whole push gate when **deleting** a remote branch (`git push origin --delete ci-red-check` was blocked). `.githooks/pre-push` now reads git's ref lines and skips the gate when every local sha is all zeros (delete-only pushes send no commits).
  - [x] Also fixed (found in the WH-011 review): the unused-translation-key check treated `Spaces.roles.permissions.*` as unused, because the page reads them as `t(\`permissions.${permission}\`)` with dotted values (`space.settings.write`), so the dynamic segment is a **grandparent** of the leaves. `findUnusedMessageKeys()` now accepts any ancestor read with `${…}`, plus a test (quality tests 10/10).

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

### WH-058 · Teams and the Manager role
- **Type:** feature · **Priority:** P2 · **Status:** done · **Area:** api + client + database
- **Why:** the PRD has four roles (Owner, Admin/HR, **Manager**, Employee) and FR-MEM-05/06 need teams with one or more managers who approve their team's leave. The code only has Owner, Admin and Member presets and no teams. Approvals (WH-062) can't route without this.
- **Scope:**
  - [x] a `Manager` system role preset (`leave.approve`, optional `documents.fulfil`, `calendar.read`, …);
  - [x] `teams` + `team_members` + `team_managers` tables with RLS;
  - [x] CRUD under `teams.write`;
  - [x] assign a member's team and manager (FR-MEM-05);
  - [x] the "Teams" page replaces its placeholder.
- **Done when:** an Admin creates a team, adds members and managers; a manager sees only their teams' requests (once WH-062 exists).
- **UI placement (2026-10-17, see WH-073):** teams appear as a **"Groups" tab inside the Team page**, not as a separate sidebar item. The user-facing word "Team" now means the whole workspace roster, so use "Groups" in the UI (keep `teams` as the table and permission name: `teams.write`).
- **Progress (2026-10-18):** `SYSTEM_ROLE_NAMES.MANAGER` with Member + `leave.approve` + `documents.fulfil` (Member ⊆ Manager ⊆ Admin ⊆ Owner). Migration `20261018150000_teams_and_manager_role` creates teams tables + RLS and backfills Manager on existing spaces. Seed/`systemRolesFor` create Manager for new workspaces.
- **Progress (2026-10-18):** API `GET/POST/PATCH/DELETE …/teams` (`members.read` list, `teams.write` mutations); contracts + unit/integration tests (CRUD, name conflict, RLS). Client Groups tab: list/create/edit/delete with member + manager pickers (`useCan(TEAMS_WRITE)`). Ready for batch review.
- **Review (2026-10-18):** 🔁 a solid base; three fixes. Verified:
  - migration `20261018150000_teams_and_manager_role` (applied): `teams`, `team_members` and `team_managers` with forced tenant RLS, unique names per space, cascades; the **app role's grants** cover them (default privileges);
  - the **Manager** backfill on existing spaces (live roles: Admin, Manager, Member\*, Owner); `systemRolesFor()` creates it for new workspaces; the catalog test keeps Member ⊆ Manager ⊆ Admin ⊆ Owner;
  - **live:** a Member creating a team → 403; an Admin creating one → 201; a duplicate name → 409; a Member listing teams → 200 (`members.read`); delete → 204; tests: teams service (3) + integration (3).
  - [x] **Managers who can't approve.** `assertManagersCanApprove` → 400 `VALIDATION_FAILED` when a manager's role lacks `leave.approve`. Groups picker lists only members with that permission; member list API now returns `role.permissions`.
  - [x] **Same-workspace integrity in the database.** Migration uses composite FKs: `UNIQUE (id, space_id)` on `teams` / `memberships`, and `FOREIGN KEY (team_id|membership_id, space_id)` on `team_members` / `team_managers`.
  - [x] Minor: backfill comment notes `gen_random_uuid()` (v4) vs app UUID v7.
  - [x] Browser check: the Groups tab (create/edit with the member and manager pickers, `teams.write` gating; manager list excludes plain Members) in `ar`.
- **Progress (2026-10-18, review fixes):** manager `leave.approve` guard + UI filter; composite same-space FKs in `20261018150000_teams_and_manager_role`; member `role.permissions` on the list contract.
- **Review (2026-10-18, 2nd pass):** 🔁 the feedback is fixed, but the suite is red. Verified:
  - **manager rule:** `TeamsService` rejects managers whose role lacks `leave.approve` → 400 `VALIDATION_FAILED` (unit test `teams.service.spec.ts:118`, integration `teams.integration.spec.ts:197`); the Groups picker lists only people with `leave.approve`;
  - **composite FKs**, edited into the still-uncommitted migration and re-applied at 15:46 (checksum matches the file): `UNIQUE (id, space_id)` on `teams` and `memberships`, plus `(team_id, space_id)` / `(membership_id, space_id)` FKs on both link tables. **Proven in Postgres** (rolled back): a team in workspace A with a membership from B → `team_members_membership_space_fkey` violation; a link row with B's `space_id` and A's team → `team_managers_team_space_fkey` violation;
  - the UUID v4 backfill comment is added.
  - [x] 🔴 **Typecheck fails** in `@work-hub/spaces`: `toMember` now filters through `PERMISSION_LIST` via `catalogPermissions()`.
  - [x] 🔴 **A client test fails:** `specs/members-api.spec.ts` fixture includes `role.permissions`.
  - [x] Browser check: Groups in `ar` — New group dialog; managers list = Owner only (approver); members list includes Member + Owner; RTL + translated hint. Dev restarted 15:56.
- **Progress (2026-10-18, review fixes 2nd pass):** catalog filter on member permissions; members-api fixture updated; Arabic Groups browser check.
- **Review (2026-10-18, final):** ✅ **done.**
  - `members.service.ts` `toMember()` now narrows role permissions with `catalogPermissions()` (a type guard over the catalog, so stale DB values never reach the contract); the `members-api.spec.ts` fixture has `role.permissions`; `pnpm quality` is all green.
  - **Live, fresh API:** a plain Member as manager → **400 `VALIDATION_FAILED`**; an Admin (with `leave.approve`) → 201.
  - **Browser, `ar`:** the Groups tab lists the team (manager and members, "1 member · 1 manager", Edit/Delete, New group); the **manager picker lists only approvers** (Adam Admin, Mohamed Saouab, Olivia Owner, without "Member") with an explanatory hint. The test team was deleted afterwards.

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
