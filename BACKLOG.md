# WorkHub Backlog

The single list of planned work, bugs and tech debt. Every section is **ordered by priority** (P0 first), then by planned order.
Update it in the same commit as the work.

_Last updated: 2026-10-17_

## Workflow

Every ticket has exactly one **Status**:

| Status | Meaning | Who sets it |
|---|---|---|
| `start` | Created, not touched yet | Whoever creates the ticket |
| `in progress` | Someone started, or touched code in this ticket's scope | You, or Claude when it sees changes in that scope |
| `under-review` | You consider it finished | **You** |
| `done` | Reviewed against the Definition of Done **and committed** | **Claude**, after review |

```
start ──▶ in progress ──▶ under-review ──▶ done
                ▲               │
                └── changes ────┘   (review found issues: the ticket stays
                    requested        under-review with a feedback list)
```

**Review rules (Claude's job):** for each ticket in **Under review**:
1. Check every acceptance criterion and the Definition of Done: read the code, run `pnpm nx run-many -t typecheck lint test`, and check the running app for user-facing work.
2. **All good and committed** → status `done`. The ticket is removed from the active sections and gets one row in the **Done** table (commit hash, review date).
3. **Not done** → the ticket stays `under-review`, gets a dated **Review** entry marked 🔁 *changes requested* with a checklist of what to fix, and its row in the **Review tracker** is updated. When the fixes land, it's reviewed again.
4. New problems outside the ticket's scope become new `start` tickets.

Run `pnpm backlog` to see every ticket by status, and to catch format mistakes (unknown status, duplicate ID, wrong order).

**Ticket ID:** `WH-###`, never reused; new tickets take the next free number.
**Priority:** **P0** broken or insecure, fix first · **P1** current milestone · **P2** planned · **P3** nice to have / cleanup.
**Type:** `feature` · `bug` · `security` · `tech-debt` · `chore`

**Ticket format:**
- **Why** it exists, **Scope** (what's in it), **Acceptance criteria** (checks that prove it's done);
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
- Committed. The commit hash goes into the Done table.

**Roadmap (from the plan we agreed):** one feature at a time, backend and frontend together:
1. Login UI + frontend foundation (translations, RTL, hooks). **Current milestone**
2. Workspaces, roles, memberships (+ per-workspace data isolation)
3. Invites (email and link, expiry, default role)
4. Permissions management
5. OAuth sign-in (Google, GitHub, Microsoft, GitLab)

---

## Review tracker

One row per ticket in **Under review**. Updated after every review.

| Ticket | Under review since | Last review | Result | Open feedback |
|---|---|---|---|---|
| WH-035 · Backlog workflow and `pnpm backlog` tracker | 2026-10-17 | 2026-10-17 | ✅ self-check, waiting for commit | 1 |
| WH-001 · Finish moving the web app to language URLs (`/en`, `/fr`, `/ar`) | 2026-10-17 | 2026-10-17 | 🔁 changes requested: commit (+ items listed in the ticket) | 4 |
| WH-002 · Bug: unverified users hit a dead end on sign-in | 2026-10-17 | 2026-10-17 | 🔁 changes requested: commit (+ items listed in the ticket) | 1 |
| WH-033 · Bug: sign-in and sign-up errors are always in English | 2026-10-17 | 2026-10-17 | 🔁 changes requested: commit (+ items listed in the ticket) | 4 |
| WH-031 · Show/hide password button on password fields | 2026-10-17 | 2026-10-17 | 🔁 changes requested: commit (+ items listed in the ticket) | 3 |
| WH-020 · Outdated comment in `merge-auth-openapi.ts` | 2026-10-17 | 2026-10-17 | 🔁 changes requested: commit (+ items listed in the ticket) | 0 |
| WH-029 · Lint warning: unused `eslint-disable` in the landing test | 2026-10-17 | 2026-10-17 | 🔁 changes requested: commit (+ items listed in the ticket) | 0 |
| WH-030 · `next-env.d.ts` changes every time you switch between `dev` and `build` | 2026-10-17 | 2026-10-17 | 🔁 changes requested: commit (+ items listed in the ticket) | 0 |
| WH-034 · Email addresses inside Arabic sentences may display out of order | 2026-10-17 | 2026-10-17 | 🔁 changes requested: commit (+ items listed in the ticket) | 0 |

## Under review

Finished by you, waiting for (or going through) review.

### WH-035 · Backlog workflow (start → in progress → under-review → done) and `pnpm backlog` tracker
- **Type:** chore · **Priority:** P1 · **Status:** under-review · **Area:** docs + tools
- **Why:** you asked for a clear 4-step ticket workflow, with Claude reviewing every `under-review` ticket and moving it to done, or back with feedback.
- **Scope:**
  - `BACKLOG.md` restructured: the Workflow section, a Review tracker table, and Under review / In progress / Start / Done sections. The old statuses were mapped: `ready`/`later`/`blocked` → `start`, `implemented, waiting for commit` → `under-review`.
  - `tools/backlog/` (`@work-hub/backlog`, no dependencies): parses the backlog and checks it:
    - every status is one of the 4;
    - each ticket sits in the section that matches its status;
    - no `done` ticket is left in an active section;
    - no duplicate IDs;
    - every section is ordered by priority;
    - the Review tracker matches the `under-review` tickets.
  - `pnpm backlog` prints tickets by status and exits 1 on any problem.
- **Acceptance criteria:**
  - [x] `pnpm backlog` lists the review queue first and reports `✓ BACKLOG.md is valid`.
  - [x] 6 `node:test` tests pass; Nx runs them with `lint` in `run-many`.
  - [x] On its first run, the tracker caught a real inconsistency (WH-001 listed in the Done table while still active), which was then fixed.
  - [ ] Commit.
- **Review (2026-10-17):** ✅ self-check; waiting for your look and the commit.

### WH-001 · Finish moving the web app to language URLs (`/en`, `/fr`, `/ar`)
- **Type:** feature · **Priority:** P1 · **Status:** under-review · **Area:** client
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
  - [ ] Commit the `nx sync` change in `apps/client/tsconfig.json` (new reference to `libs/shared/constants`). It's uncommitted, and without it a fresh clone's `pnpm dev` refuses to start.
- **Notes:** the main work landed in `fbff533`.
- **Review (2026-10-17):** structure is right: shared `LOCALES`/`DEFAULT_LOCALE`, `hasLocale` guard with `notFound()`, `setRequestLocale` for static rendering, `localeDirection()` from `RTL_LOCALES`. To clean up:
  - [x] `layout.tsx`: `locale === 'ar' ? 'font-arabic'` hard-codes Arabic. Derive it from the locale, e.g. a `LOCALE_FONT` map next to `localeDirection()`, so a future RTL language doesn't silently get the wrong font.
  - [x] `layout.tsx`: `defaultLocale={locale ?? DEFAULT_LOCALE}`: `locale` can't be empty after the `hasLocale` check, so `?? DEFAULT_LOCALE` is dead code. The `rawLocale as Locale` cast is also unneeded, since `hasLocale` already narrows the type.
  - [x] `src/i18n/locale.ts`: `isAppLocale()` is exported but used nowhere. `LocaleSwitcher` re-implements the same check with `LOCALES.includes(...)`. Use one (see WH-005).
- **Review (2026-10-17, round 2):** ✅ `proxy.ts` works (`/sign-in` → 307 `/en/sign-in`); `specs/message-keys.spec.ts` keeps en/fr/ar identical; `localeFontClass()` replaces the hard-coded `'ar'`; dead `?? DEFAULT_LOCALE` removed; `isAppLocale()` now used. Left:
  - [ ] `layout.tsx:46`: `rawLocale as Locale` is still there. `hasLocale()` already narrows the type, so use the value directly.
  - [ ] Minor: `localeFontClass()` picks the Arabic font for *any* right-to-left language. A per-language map (`{ ar: 'font-arabic' }`) would be exact if a non-Arabic RTL language is ever added.
  - [ ] Commit, including the `apps/client/tsconfig.json` reference.

### WH-002 · Bug: unverified users hit a dead end on sign-in
- **Type:** bug · **Priority:** P1 · **Status:** under-review · **Area:** client
- **Why:** a user who signs in before verifying their email only sees "Email not verified", with no way to get a new link. A redirect fixing this was added, then lost when the sign-in form was rewritten for translations (WH-001).
- **Scope:** in `sign-in-form.tsx`, when the error code is `EMAIL_NOT_VERIFIED`, redirect to `/{locale}/verify-email?email=…`. The "Resend" button already exists there.
- **Acceptance criteria:**
  - [x] Signing in as `unverified@workhub.test` / `workhub-dev-1` lands on the verify-email page, with the email filled in.
  - [ ] "Resend" sends a new email (visible in Mailpit).
  - [x] The redirect keeps the current language (`/ar/...` stays Arabic).
- **Depends on:** WH-001 (localized URLs).
- **Review (2026-10-17, round 2):** ✅ `sign-in-form.tsx` redirects on `EMAIL_NOT_VERIFIED`, keeps `{ locale }`, and URL-encodes the email. Left: [ ] confirm "Resend" in the browser after restarting the dev server, then commit.

### WH-033 · Bug: sign-in and sign-up errors are always in English
- **Type:** bug · **Priority:** P1 · **Status:** under-review · **Area:** client
- **Why:** on `/ar/sign-in`, a failed sign-in shows Better Auth's English text ("Email not verified", "Invalid email or password"…), because `authErrorMessage()` shows `error.message` as-is.
- **Scope:** map Better Auth error **codes** to translated messages in `messages/{en,fr,ar}.json`. The codes include `INVALID_EMAIL_OR_PASSWORD`, `EMAIL_NOT_VERIFIED`, `USER_ALREADY_EXISTS`, `PASSWORD_TOO_SHORT`, `INVALID_TOKEN` and 429 (too many attempts). Unknown codes fall back to a translated "Something went wrong". Never show the server's raw English text.
- **Acceptance criteria:**
  - [ ] Wrong password on `/ar/sign-in` shows Arabic text; on `/fr/sign-in`, French.
  - [x] ~~Signing up with an existing email shows "account already exists"~~. **Corrected 2026-10-17:** with email verification on, Better Auth deliberately answers a duplicate sign-up exactly like a new one (no error, no email, nothing changed), so nobody can probe which emails have accounts. Verified with `member@workhub.test`. The right check: a duplicate sign-up shows the same "check your email" screen as a new one.
  - [ ] Six quick wrong attempts show a translated "too many attempts" message.
  - [x] A unit test covers the code → message mapping, including the fallback.
- **Related:** WH-002 (that code redirects instead of showing a message).
- **Review (2026-10-17, round 2):** ✅ `authErrorKey()` maps codes → translated keys and never returns the server text (tested, including an "Internal prisma dump" case); all 5 forms use it; 429 is handled by status. Left:
  - [ ] **Dead entry:** `USER_ALREADY_EXISTS` can't happen in our setup (see the correction above), and Better Auth's real code is `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`. Remove it and its 3 translations, or rename it if email verification is ever turned off.
  - [ ] Browser check: wrong password on `/ar/sign-in` shows Arabic; 6 quick tries show the translated "too many attempts".

### WH-031 · Show/hide password button on password fields
- **Type:** feature · **Priority:** P2 · **Status:** under-review · **Area:** client
- **Why:** users mistype long passwords (the minimum is 10 characters). A visibility toggle reduces failed sign-ins and resets.
- **Scope:** a reusable `PasswordInput` (`src/components/ui/password-input.tsx`) with an eye button, used in sign-in, sign-up and reset-password. Translated labels (`Auth.fields.password.show` / `hide`), positioned with logical CSS (`end-*`, `pe-*`) so it flips correctly in Arabic.
- **Acceptance criteria:**
  - [ ] The toggle works in all 3 forms, and the field goes back to hidden on submit or navigation.
  - [ ] The button has an accessible label that matches its state ("Show password" / "Hide password") in each language, and is reachable with the keyboard.
  - [x] In `/ar`, the eye icon doesn't overlap the text. _(The design changed on 2026-10-17: password and email fields now stay left-to-right in Arabic, so the icon is on the right. That's a valid, common choice for Latin-script values.)_
  - [ ] The password managers' autofill (`autoComplete`) still works. _(the props are passed through unchanged; confirm in the browser)_
- **Progress (2026-10-17):** `PasswordInput` is built and used in sign-in, sign-up and reset. `Input` now forces `dir="ltr"` for `email`, `password`, `url`, `tel` and `number` fields (uncommitted).
- **Review (2026-10-17):**
  - [x] Correct: `PasswordInput` sets `dir="ltr"` itself, because when shown, the field's type becomes `text`, which `Input` would no longer force to LTR. That case is handled.
  - [x] **Accessibility:** use either `aria-pressed` with a **fixed** label ("Show password"), or a label that changes without `aria-pressed`, not both. Today the label flips **and** `aria-pressed` flips, so screen readers announce a pressed "Hide password" button, which is confusing.
  - [x] **Arabic placeholders in LTR fields** ("10 أحرف على الأقل", "you@company.com") are now left-aligned on Arabic pages. Add `rtl:placeholder:text-right` in `Input` for forced-LTR fields, so the hint lines up with the right-aligned labels.
  - [x] **Consistency:** `password-input.tsx`, `input.tsx` and `button.tsx` import `cn` from `'cn'`; the other 9 files use `'@/lib/utils'`, which just re-exports it. Pick one (`@/lib/utils`), so it can later be swapped for a tailwind-merge version in one place.
  - [x] Add a unit test: clicking the button toggles the field type and the accessible state.
- **Review (2026-10-17, round 2):** ✅ all 4 round-1 issues fixed: only the label changes (no `aria-pressed` conflict); `rtl:placeholder:text-right` lines up the hints; every file now imports `cn` from `@/lib/utils`; a unit test covers the toggle. Also verified that `inset-e-2` (dropdown-menu) is a valid Tailwind 4.3 class. Left: [ ] the first two criteria in the browser, then commit.

### WH-020 · Outdated comment in `merge-auth-openapi.ts`
- **Type:** tech-debt · **Priority:** P3 · **Status:** under-review · **Area:** api
- **Why:** lines 16–17 say Better Auth's security markers are rewritten to the session cookie; the code now **drops** them.
- **Fix:** replace them with "drops Better Auth's security markers: it marks every route as protected, including public ones, which would put a lock on sign-up in Swagger."
- **Review (2026-10-17, round 2):** ✅ comment updated in `merge-auth-openapi.ts`.

### WH-029 · Lint warning: unused `eslint-disable` in the landing test
- **Type:** tech-debt · **Priority:** P3 · **Status:** under-review · **Area:** client
- **Why:** `apps/client/specs/index.spec.tsx` line 8 disables `@next/next/no-img-element`, but that rule never fires there, so ESLint warns `Unused eslint-disable directive`.
- **Fix:** delete the comment line. **Done when:** `nx run-many -t lint` reports 0 problems.
- **Review (2026-10-17, round 2):** ✅ the unused `eslint-disable` removed; lint reports 0 problems.

### WH-030 · `next-env.d.ts` changes every time you switch between `dev` and `build`
- **Type:** chore · **Priority:** P3 · **Status:** under-review · **Area:** client
- **Why:** Next.js rewrites `apps/client/next-env.d.ts` (`.next/types` vs `.next/dev/types`), so it keeps showing up as modified in `git status`.
- **Fix:** Next.js generates this file, so add it to `.gitignore` and `git rm --cached` it.
- **Done when:** running `pnpm dev` or a build leaves `git status` clean.
- **Review (2026-10-17, round 2):** ✅ `apps/client/next-env.d.ts` gitignored and removed from the index (`git rm --cached`); the file stays on disk.

### WH-034 · Email addresses inside Arabic sentences may display out of order
- **Type:** bug · **Priority:** P3 · **Status:** under-review · **Area:** client
- **Why:** on `/ar/verify-email`, the sentence "We sent a link to {email}" mixes a left-to-right address into right-to-left text. Browsers can then place the address or the punctuation around it in the wrong spot.
- **Fix:** wrap inserted values that are left-to-right (emails, URLs) in `<bdi>`, or in `<span dir="ltr">`, using next-intl's rich text.
- **Done when:** in `/ar`, the email in the verify page reads correctly, with the punctuation on the right side of it.
- **Review (2026-10-17, round 2):** ✅ the verify-email and forgot-password messages wrap the email in `<bdi>` through `t.rich`, the recommended fix. Left: [ ] look at `/ar/verify-email` in the browser, then commit.

## In progress

Started, or code in the ticket's scope has changed.

### WH-005 · Language switcher: `useUpdateMe`, `useLocaleSwitcher`, `useDirection`
- **Type:** feature · **Priority:** P1 · **Status:** in progress · **Area:** client
- **Why:** users must be able to change their language. The API already supports it (`PATCH /api/v1/me`).
- **Progress (2026-10-17):** a working `LocaleSwitcher` component exists (`src/components/i18n/locale-switcher.tsx`). It calls `updateMe()`, refreshes the `['me']` cache and switches the URL language. What's left is moving that logic into the hooks below, so other screens can reuse it, and checking the acceptance criteria in the browser.
- **Review (2026-10-17) of `locale-switcher.tsx`:** works (browser-checked: your account `en` → `ar` was saved). Issues:
  - [x] **Errors are swallowed:** `catch { }` hides a failed save. The URL changes but the saved language doesn't, and the user isn't told. That breaks the acceptance criterion "a failed save shows an error message". Show a translated error, and keep or revert the URL deliberately.
  - [x] **Logic in the component:** `updateMe` plus the cache update belong in `useUpdateMe()`, and the switch flow in `useLocaleSwitcher()` (this ticket's scope).
  - [x] **Raw cache key `['me']`:** use `queryKeys.me` (WH-004). Use `setQueryData` with the returned user instead of `invalidateQueries`, which costs an extra `/me` request.
  - [x] **`useMe()` just to know if the user is signed in:** it fetches `/me` on every page that shows the switcher. Use `useAuth().isSignedIn` (WH-004).
  - [x] **Duplicate locale check:** replace `LOCALES.includes(next as Locale)` and the cast with the existing `isAppLocale(next)` from `src/i18n/locale.ts`.
  - [x] `router.refresh()` right after `router.replace(…, { locale })` likely re-renders twice. Check whether it's needed.
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
- **Review (2026-10-17, round 2):** round-1 issues fixed ✅:
  - logic moved into `useUpdateMe` / `useLocaleSwitcher` / `useDirection`;
  - a failed save shows a translated error and keeps the page as it was;
  - `queryKeys.me` with `setQueryData` (no extra `/me` request);
  - signed-in check from the session, not `/me`;
  - `isAppLocale()` used;
  - `router.refresh()` removed.

  Left:
  - [ ] **Acceptance not met yet:** "after sign-out and sign-in again, the app opens in the saved language". `sign-in-form.tsx:61` goes to `/app` in the *current URL's* language. Use the `locale` from the sign-in response's `user` instead.
  - [ ] Unit tests for the 3 hooks: save failure shows the error and doesn't navigate; signed-out users don't call the API; `useDirection` returns `rtl` for `ar`.
  - [ ] `useDirection()` has no users yet. Fine as planned API, but keep it covered by a test so it doesn't rot.

### WH-004 · Hooks foundation: `queryKeys`, `useAuth`, `useRequireAuth`
- **Type:** tech-debt · **Priority:** P1 · **Status:** in progress · **Area:** client
- **Why:** session logic is copied into `AppHome` and `AuthNav`, and each future page would copy it again. Cache keys written by hand (`['me']`) lead to "screen didn't update" bugs when a typo appears.
- **Scope:**
  - **`src/lib/api/query-keys.ts`:** every TanStack Query key in one object, e.g. `queryKeys.me`, `queryKeys.spaces.detail(slug)`. All hooks use it; no raw key arrays anywhere.
  - **`src/hooks/use-auth.ts` → `useAuth()`:** returns `{ user, isSignedIn, isPending, signOut }`. `signOut` signs out **and** clears the query cache (fixes WH-003).
  - **`src/hooks/use-require-auth.ts` → `useRequireAuth()`:** for signed-in pages. Redirects to `/{locale}/sign-in` when there's no session; returns the same values as `useAuth`. This is a user-experience guard only: the API still rejects every request without a session.
  - Replace the duplicated logic in `AppHome` (its `useEffect` redirect) and `AuthNav` with these hooks. Update `useMe` to use `queryKeys.me`.
- **Acceptance criteria:**
  - [ ] `AppHome` and `AuthNav` contain no direct `authClient.useSession()` or `authClient.signOut()` calls.
  - [ ] Opening `/en/app` while signed out redirects to `/en/sign-in`; while signed in, it shows the user.
  - [x] No raw query-key arrays remain in the client (`grep "queryKey: \['"` finds nothing).
  - [ ] Unit tests for `useAuth` (sign-out clears the cache) and `useRequireAuth` (redirects when signed out).
- **Depends on:** WH-001 (redirect target is a localized URL).
- **Progress (2026-10-17):** `src/lib/api/query-keys.ts` exists, `useMe` uses `queryKeys.me`, no raw key arrays remain. **Not started:** `useAuth()` and `useRequireAuth()`. Sign-out is still duplicated in `auth-nav.tsx:25` and `app-home.tsx:27`, so **WH-003 (cache not cleared on sign-out) is still open**.

### WH-028 · Readiness probe leaks internal error text and uses the wrong error code
- **Type:** security · **Priority:** P2 · **Status:** in progress · **Area:** api
- **Why:** with the database down, the public `GET /health/ready` returns Prisma's internal message (`Invalid prisma.$queryRawUnsafe() invocation`) and labels a 503 as `"code":"INTERNAL_ERROR"`. Internal details help attackers, and the wrong code misleads monitoring.
- **Scope:**
  - The database health check returns a generic `"unreachable"` and logs the real reason server-side, as the Step 1 guide proposed. Terminus' `PrismaHealthIndicator` puts the raw error in the response.
  - Add `SERVICE_UNAVAILABLE` to `ErrorCode` in `libs/shared/constants`, and use it for 503s in `ProblemDetailsFilter`.
- **Acceptance criteria:**
  - [ ] With Docker stopped, `/health/ready` returns 503 with `"code":"SERVICE_UNAVAILABLE"` and no Prisma text.
  - [ ] The real error appears in the server log.
  - [x] The filter and health tests cover both points.
- **Review (2026-10-17, round 2):** ✅ new `SERVICE_UNAVAILABLE` code in the shared constants, mapped by the filter; the database check returns a generic `"unreachable"` and logs the real error; a test asserts "prisma" never reaches the response. Left:
  - [ ] **No timeout.** The replaced Terminus helper gave up after 1 s. The new `checkDatabase()` waits as long as the database takes, and `PrismaService` sets no `connectionTimeoutMillis`, so a *hanging* database makes `/health/ready` hang. Add a ~1 s timeout and report `down` when it fires.
  - [ ] **Test noise:** the "database down" test prints a red `ERROR [HealthController] …` line. Silence and assert it, like `problem-details.filter.spec.ts` does (`vi.spyOn(controller['logger'], 'error')`).
  - [ ] Minor: prefer the tagged `$queryRaw` form over `$queryRawUnsafe('SELECT 1')`. It's safe as written, but the tagged form is the pattern worth copying.
  - [ ] Check in the browser with Docker stopped: `/health/ready` → 503 `SERVICE_UNAVAILABLE`, no Prisma text. Restart `pnpm dev` first: the running server still has the old code.

## Start

Not started. Ordered by priority, then by planned order: take tickets from the top.

### WH-003 · Security: sign-out keeps the previous user's data in the browser cache
- **Type:** security · **Priority:** P1 · **Status:** start · **Area:** client
- **Why:** `AppHome` and `AuthNav` call `authClient.signOut()` but never clear TanStack Query's cache. If user A signs out and user B signs in on the same browser, B can briefly see A's cached `/me` data.
- **Scope:** sign-out calls `queryClient.clear()` after `authClient.signOut()`. Done once, inside `useAuth()` (WH-004), and used everywhere.
- **Acceptance criteria:**
  - [ ] Sign in as `member@workhub.test`, open `/app`, sign out, then sign in as `admin@workhub.test`: the page never shows Mia's data, not even for a moment.
  - [ ] There is only one sign-out implementation in the client (no copies in components).
- **Depends on:** WH-004.

### WH-006 · Browser test of every auth flow after the language move
- **Type:** chore · **Priority:** P1 · **Status:** start · **Area:** client + api
- **Why:** sign-up, verify, forgot and reset password have only been tested with curl, or not at all, since the web pages changed.
- **Scope:** manual browser pass, then one automated Playwright test in `apps/client-e2e`.
- **Acceptance criteria:**
  - [ ] Manual, in `en` and `ar`: sign up → email in Mailpit → link signs in → `/app` shows the user → sign out.
    _2026-10-17: passed in `en` (by hand) and in `ar` (browser test): sign-up → `/ar/verify-email` → email link → `/ar/app` signed in → sign-out → `/ar/app` redirects to `/ar/sign-in`. Found WH-032 (language saved as `en`), WH-033, WH-034._
  - [x] Manual: forgot password → email → reset page → new password works, old one fails. _(2026-10-17: reset token used, all sessions revoked)_
  - [ ] Playwright test: sign up a new `@workhub.test` user, read the verification link from the Mailpit API (`GET localhost:8025/api/v1/message/latest`), open it, and assert `/app` shows the user's name.
  - [ ] The Playwright test cleans up after itself (or the suite runs `pnpm db:seed -- --reset` first).
- **Depends on:** WH-001, WH-002.

### WH-009 · Workspaces, roles and memberships (backend + UI)
- **Type:** feature · **Priority:** P1 (next milestone) · **Status:** start · **Area:** api + client + database
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

### WH-023 · Pages guarded only in the browser
- **Type:** tech-debt · **Priority:** P3 · **Status:** start · **Area:** client
- **Why:** `/app` shows "Checking session…" and then redirects, because the guard runs in the browser. It's safe (the API refuses data) but flickers.
- **Fix:** check the session server-side (middleware/proxy or a server component) and redirect before rendering.

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

### WH-027 · Developer setup notes in the README
- **Type:** chore · **Priority:** P3 · **Status:** start · **Area:** docs
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
| Step 4a (most of WH-001) | Pages under `[locale]`, en/fr/ar messages, RTL for Arabic, auth screens, language switcher, `BACKLOG.md` | `fbff533` |
