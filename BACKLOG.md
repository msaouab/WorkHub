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

**Ticket ID:** `WH-###`, never reused (not even after a ticket is deleted). New tickets take the next free number: **next free is WH-055**.
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

### WH-053 · Finish the app layout: every sidebar item, its page, and "coming soon" placeholders
- **Type:** feature · **Priority:** P1 · **Status:** in progress · **Area:** client
- **Why:** WH-052 (`d39d25a`) shipped the shell: top bar, workspace sidebar, settings nav, phone drawer, collapse. But the sidebars only list the 2–3 pages that exist today, so the product's shape (leave, calendar, holidays, documents, approvals…) is invisible and every new feature has to touch the layout again. This ticket **completes the layout from the mockups**: every item, in its final place, with its route, its permission, and a page. Features that aren't built yet show a translated **"coming soon"** page, so later tickets only replace a placeholder.
- **Today:**
  - `lib/nav/space-nav.ts` lists Home + Settings (Members is hidden until WH-046);
  - `lib/nav/settings-nav.ts` lists Profile, Language, Password;
  - pages exist for `/s/{slug}`, `/s/{slug}/members` (stub), `/s/{slug}/settings`, `/settings`, `/settings/language`, `/settings/password`, `/dashboard`, `/spaces`, `/spaces/new`.

#### 1. Top bar (every signed-in page)
| Element | Behaviour | Status |
|---|---|---|
| ☰ menu button | phone only (< 1024 px); opens the drawer for the current context | done |
| Logo | links to `/{locale}/dashboard` | done |
| Context label | inside a workspace: the workspace name; in settings: "Account settings" (breadcrumb) | **new** |
| Search | a 280 px field ("Search {workspace}…"), opens nothing yet: shows a "Search is coming soon" tooltip/popover. Hidden outside a workspace and on phones | **soon** |
| Notifications | bell icon → `/{locale}/notifications` (coming-soon page). No badge until real data exists | **soon** |
| Language | the existing `LocaleSwitcher` | done |
| Profile menu | the existing `UserMenu` (WH-048): name, email, Settings, Sign out | done |

#### 2. Workspace sidebar (`/{locale}/s/{slug}/…`)
- **Header: workspace switcher.** Logo (or initials), name, your role (translated). The menu lists your other workspaces (logo + name), then "All workspaces" → `/dashboard`, then "Create workspace" → `/spaces/new`.
- **Items.** One line each in `space-nav.ts`. Permission names are from `@work-hub/constants` `PERMISSIONS`; an item without a permission is visible to every member.

| Section | Item | Route `/s/{slug}…` | Icon (lucide) | Shown to (permission) | Page now | Built by |
|---|---|---|---|---|---|---|
| main | Home | `` | `house` | everyone | real (cover, logo, summary) | done |
| main | My leave | `/leave` | `palmtree` | `requests.create` | coming soon | leave feature |
| main | Team calendar | `/calendar` | `calendar-days` | `calendar.read` | coming soon | calendar feature |
| main | Holidays | `/holidays` | `party-popper` | everyone | coming soon | holidays feature |
| main | Documents | `/documents` | `file-text` | `requests.create` | coming soon | documents feature |
| main | People | `/people` | `users` | `members.read` | coming soon → real in WH-046/WH-016 | WH-046 |
| manage | Approvals | `/approvals` | `list-checks` | `leave.approve` or `documents.fulfil` | coming soon | approvals feature |
| manage | Invites | `/invites` | `mail-plus` | `invites.write` | coming soon | WH-010 |
| manage | Roles and permissions | `/roles` | `shield` | `roles.write` | coming soon | WH-011 |
| manage | Teams | `/teams` | `network` | `teams.write` | coming soon | teams feature |
| manage | Leave policies | `/leave-policies` | `sliders-horizontal` | `leave_types.write` or `balances.adjust` | coming soon | leave feature |
| manage | Settings | `/settings` | `settings` | `space.settings.write` | real (general + branding) | done |

  - **People goes in *main*,** not *Manage*: every member has `members.read`, so the directory is for everyone, while the admin actions live inside the page (with `members.write`). The *Manage* section then only appears for roles that have at least one manage item, so a plain **Member never sees "Manage"** (the AC from WH-052).
  - Rename the existing `/s/{slug}/members` route to **`/s/{slug}/people`**, with a 308 redirect from `/members` (`next.config.js`).
  - "Any of" permissions (Approvals, Leave policies): `permission` becomes `Permission | Permission[]`, and `filterSpaceNav()` treats an array as **any**. Add tests.
- **Footer:**
  - "Help and feedback" → `/{locale}/contact` (existing page);
  - "Collapse" / "Expand" (existing, cookie `wh_sidebar`).
- **Workspace settings page** (`/s/{slug}/settings`) gets an in-page section nav, not a third sidebar:
  - **General:** name, slug (read-only for now) → coming soon for editing;
  - **Branding:** the existing logo + cover (WH-047);
  - **Billing:** `space.billing.write`, coming soon;
  - **Danger zone:** `space.delete`, "Delete workspace", coming soon.

  Each section is shown only with its permission.

#### 3. Your dashboard (`/{locale}/dashboard`, no sidebar)
| Element | Behaviour | Status |
|---|---|---|
| "Your workspaces" | cards: cover, logo, name, your role; click → `/s/{slug}` | done |
| "Create workspace" card | → `/spaces/new` | done |
| "Your requests, everywhere" | section header + a "coming soon" empty state (leave and document requests across workspaces) | **soon** |

#### 4. Account settings nav (`/{locale}/settings/…`)
| Item | Route | Page now | Built by |
|---|---|---|---|
| ← Back to {last workspace} / Back to dashboard | the last workspace, or `/dashboard` | done | |
| Profile (name, picture) | `/settings` | real | done (WH-049/WH-050) |
| Language | `/settings/language` | real | done |
| Password | `/settings/password` | real | done |
| Sign-in methods | `/settings/sign-in-methods` | coming soon | WH-012 |
| Sessions (devices signed in) | `/settings/sessions` | coming soon | sessions feature (Better Auth `listSessions`/`revokeSession`) |
| Notifications | `/settings/notifications` | coming soon | notifications feature |
| Delete account | `/settings/delete-account`, shown last, in red text | coming soon | WH-025 |

#### 5. "Coming soon" page: one shared component
- `components/shell/coming-soon.tsx`: an icon (the same as the nav item), a heading with the feature name, one translated line ("We're building this. It'll be ready soon."), and a secondary button back to the context home (workspace Home / dashboard / Profile). **No ticket IDs or dates** shown to users.
- Pages are **real routes** (`page.tsx` per item) that render `<ComingSoon feature="leave" />`, with `generateMetadata` titles, so URLs, the active item, `aria-current`, breadcrumbs and the 404 page all already behave as they will later.
- Nav data gets `status: 'ready' | 'soon'`. `'soon'` items show a small "Soon" badge next to the label (hidden when collapsed; tooltip "{label} (coming soon)").
- **Permissions apply to coming-soon pages too:** a Member opening `/s/acme/roles` directly sees the existing "no access" state, not a coming-soon page. Share one `RequireSpacePermission` wrapper (client) for both kinds of pages.

#### 6. Shared page anatomy
- `components/shell/page-header.tsx`: title, optional description, optional actions slot. Every app page uses it (Home, Settings, People…) for consistent spacing and an `<h1>` per page.
- Breadcrumb in the top bar (element 1) comes from the same nav data, with no per-page strings.

#### Text, RTL, accessibility
- Labels in `Shell.spaceNav.*`, `Shell.settingsNav.*`, `Shell.topBar.*`, `ComingSoon.*` for `en`, `fr` and `ar`. Feature names are reused in the page titles.
- Icons that imply direction (back arrow) flip in RTL (`rtl:rotate-180`); everything else uses logical classes, as in WH-052.
- The "Soon" badge has text (not just colour); disabled-looking items are **not** disabled: they're real links to the placeholder page.

#### Acceptance criteria
- [ ] As **Owner** in Acme: main = Home, My leave, Team calendar, Holidays, Documents, People; *Manage* = Approvals, Invites, Roles and permissions, Teams, Leave policies, Settings. Every item opens its route; coming-soon items show the badge and the shared placeholder page.
- [ ] As **Member**: main shows Home, My leave, Team calendar, Holidays, Documents, People; **no *Manage* section**. Opening `/en/s/acme/roles` directly shows "no access", not the placeholder.
- [ ] As **Admin**: *Manage* without Settings (Owner-only), and Settings' Billing and Danger zone sections hidden.
- [ ] `/en/s/acme/members` → 308 → `/en/s/acme/people`.
- [ ] Settings nav lists Profile, Language, Password, Sign-in methods, Sessions, Notifications, Delete account; the last four show "coming soon".
- [ ] The dashboard shows the "Your requests, everywhere" coming-soon section; the bell opens `/en/notifications` (coming soon); the search field shows its "coming soon" hint.
- [ ] The top bar shows the context label (workspace name / "Account settings").
- [ ] Works in `en`, `fr` and `ar` (RTL), collapsed and expanded, and in the phone drawer; every item reachable by keyboard, with `aria-current` on the active one.
- [ ] Unit tests: nav filtering for Owner/Admin/Member including "any of" permissions; settings-nav active matching for the new items; `ComingSoon` renders the translated feature name. An e2e test clicks through every workspace item as Owner and checks Member doesn't see *Manage*.
- [ ] No new page shows a raw English string or a ticket ID.
- **Follows:** WH-052 (shell), WH-047 (branding in Settings), WH-049/WH-050 (account pages). **Each later feature replaces one placeholder:** WH-046/WH-016 (People), WH-010 (Invites), WH-011 (Roles), WH-012 (Sign-in methods), WH-025 (Delete account), plus the leave, calendar, holidays, documents, approvals, teams and notifications features.
- **Progress (2026-10-17):** started. Full `space-nav` / `settings-nav` with `status` + any-of permissions; `ComingSoon`, `RequireSpacePermission`, `PageHeader`; routes for every sidebar item + account soon pages + `/notifications`; `/members` → 308 `/people`; top bar context/search/bell; workspace settings sections; dashboard "Your requests"; en/fr/ar keys; unit + e2e tests.

### WH-046 · Members API: list, deactivate, remove, leave
- **Type:** feature · **Priority:** P2 · **Status:** start · **Area:** api
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
- **Depends on:** WH-009 (done in `d39d25a`).
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
- **Depends on:** WH-009 (done in `d39d25a`).

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

### WH-016 · `useMembers(spaceId)`: members of a workspace
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

### WH-054 · Upload follow-ups (from the WH-047/WH-050 reviews)
- **Type:** tech-debt · **Priority:** P3 · **Status:** start · **Area:** api + infra
- **Why:** three small leftovers noted when WH-047 and WH-050 were closed in `d39d25a`.
- **Scope:**
  - [ ] Delete `libs/api/auth/src/strip-client-image.ts`, its spec, and the `databaseHooks.user.update.before` that uses it. It can't work: Better Auth merges hook results (`{...actualData, ...result.data}`), so omitting `image` changes nothing. The route-level `hooks.before` on `/update-user` (400 when `image` is sent) is the real guard and has its own test.
  - [ ] A pixel-bomb upload answers 415 `IMAGE_UNSUPPORTED_TYPE`. Map sharp's "exceeds pixel limit" error to 413 `IMAGE_TOO_LARGE` (or a new `IMAGE_DIMENSIONS_TOO_LARGE`) so the client can show "image too large".
  - [ ] The bucket name `workhub` is hard-coded in `docker-compose.yml` and `docker/minio/anonymous-get-object.json`, while the API reads `STORAGE_BUCKET`. Either derive both from `STORAGE_BUCKET` (render the policy with `sed` in `minio-init`) or document that they must match.
