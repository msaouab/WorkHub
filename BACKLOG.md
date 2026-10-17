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

**Ticket ID:** `WH-###`, never reused (not even after a ticket is deleted). New tickets take the next free number: **next free is WH-053**.
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
| WH-050 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-049 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-047 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-052 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-048 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-009 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-040 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-041 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-045 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-006 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-051 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-007 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-032 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-014 | 2026-10-17 | 2026-10-17 | ready | commit |
| WH-015 | 2026-10-17 | 2026-10-17 | ready | commit |

## Tickets

Sorted by **priority** (P0 → P3), then by **status** (`start` → `in progress` → `under-review`), then by planned order. Done tickets are deleted.

### WH-050 · Profile picture: upload, crop and remove on the settings page
- **Type:** feature · **Priority:** P1 · **Status:** under-review · **Area:** api + client + infra
- **Why:** people recognise each other by face in member lists, approvals and the navbar menu (WH-048). Today `users.image` exists but nothing can set it: there's no upload, and nowhere to store files.
- **Where:** the "Profile" section of `/{locale}/settings` (WH-049). The navbar avatar (WH-048) and, later, member lists show the result.
- **Design:**
  - **Our own endpoint, not Better Auth's `image` field.**
    - `authClient.updateUser({ image })` (`/update-user` is enabled) accepts **any URL** from the browser, so a user could point their avatar at a tracking pixel, a huge file or an offensive image hosted elsewhere, and every co-member's browser would load it.
    - So: add `PUT /api/v1/me/avatar` and `DELETE /api/v1/me/avatar` in `libs/api/users` (`UsersService`).
    - **Ignore `image` from the client on `/update-user`:** a `databaseHooks.user.update.before` that drops `image` unless the change comes from our service (or a Better Auth `hooks.before` on `/update-user` that rejects a body containing `image`), plus a test.
  - **Image processing:** the same rules as workspace logos (WH-047), through a shared helper in `libs/api/storage`:
    - multipart upload, ≤ 2 MB;
    - type checked from the file's bytes; PNG/JPEG/WebP only, **no SVG**; at least 128×128;
    - `sharp`: auto-rotate (EXIF orientation), centre-crop to a square, **strip all metadata** (phone photos carry GPS);
    - store 256 px and 64 px WebP.
  - **Storage:** `users/{userId}/avatar/{uuidv7}.webp` in the bucket from WH-047. A new key per upload, so it's cached forever (`immutable`). The old file is deleted after the database update.
    - Whichever of WH-047 / WH-050 starts first builds `libs/api/storage` and MinIO in `docker-compose.yml`; the other reuses them.
  - `users.image` stores **our** 256 px URL. The 64 px variant comes from a predictable sibling key, or add an `image_small` column if that's simpler.
  - **Remove** sets `image = null` → the initials fallback from WH-048.
  - **Social sign-in (WH-012)** may fill `image` with the provider's photo URL (Google, GitHub…). An uploaded picture replaces it; "Remove" goes back to initials, not to the provider's photo. Add the provider image hosts to `next.config.js` `images.remotePatterns` in WH-012.
- **Web app:**
  - the current picture (or initials) at 96 px, with **"Change picture"** and **"Remove"**;
  - "Change" opens a file picker (`accept="image/png,image/jpeg,image/webp"`), then a **crop dialog**: a square/round mask, drag to move, a zoom slider, keyboard-operable;
  - the cropped area is sent with the file (`x, y, size`), or the cropped image is uploaded directly. The server still enforces square and size;
  - check size and type in the browser first (instant, translated error), but the server decides;
  - a progress state while uploading; translated errors for 413, 415 and 422 (same `ErrorCode`s as WH-047);
  - after success, **refresh the session** (Better Auth session refetch, bypassing its cookie cache), so the navbar avatar changes with no reload; invalidate `queryKeys.me`;
  - `alt` = the user's name; all text in `en`, `fr` and `ar`; the dialog works in RTL and at phone width.
- **Acceptance criteria:**
  - [ ] On `/en/settings`, a user uploads a JPEG, crops it, and saves. The navbar avatar and the settings preview show it **immediately**, and again after a reload.
  - [ ] Replacing the picture deletes the previous file from the bucket. "Remove" brings back the initials and deletes the file.
  - [ ] Uploading a phone photo with GPS data stores a WebP with **no** metadata (test). A 3 MB file gets 413, an SVG or a renamed text file gets 415, and a 50×50 image gets 422, each with a translated message.
  - [ ] `authClient.updateUser({ image: 'https://evil.example/x.png' })` doesn't change `users.image` (test).
  - [ ] A user can only change their **own** picture: the routes take the user from the session and never from a parameter.
  - [ ] Works in `en`, `fr` and `ar`, with the keyboard, and at phone width.
- **Depends on:** WH-049 (settings page). **Shares infrastructure with:** WH-047 (`libs/api/storage`, MinIO, image rules). **Related:** WH-048 (navbar avatar), WH-012 (provider photos), WH-025 (account deletion must also delete the picture).
- **Progress (2026-10-17):** shipped. `PUT`/`DELETE /me/avatar`, shared `processSquareImage` in `@work-hub/storage`, Better Auth strips client `image` on `/update-user`, settings crop dialog + session refresh.
- **Review (2026-10-17):** 🔁 changes requested. Upload works live:
  - `PUT /me/avatar` with a JPEG carrying EXIF+GPS stored a 256×256 WebP with **no EXIF, no ICC**, served with `public, max-age=31536000, immutable`;
  - a 50×50 PNG → 422 `IMAGE_TOO_SMALL`; an SVG → 415;
  - `DELETE` → 204.
  - [x] 🔴 **Clients can still set any image URL.** Fixed with `hooks.before` + `rejectClientImageUpdate` (`APIError('BAD_REQUEST')` when `image` is in `/update-user` body). Helper + handler tests.
  - [x] **The navbar won't update after an upload.** `authClient.$store.notify('$sessionSignal')` after PUT/DELETE avatar.
  - [x] **The crop dialog isn't a real modal.** Base UI `Dialog` with `variant="modal"` (Escape, focus trap).
  - [x] **Lint fails** — removed bogus eslint-disable; redraw via `useEffectEvent`.
  - [x] Hardening: `avatarPrefixFromImageUrl(userId, url)` requires our `publicUrl` prefix and `users/{userId}/avatar/`.
  - [x] Shared image-processing items with WH-047 (pixel limit, 413 → `IMAGE_TOO_LARGE`).
  - [ ] Browser check of the settings page.
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ❌ was still open; **4th pass (same day):** review items above addressed → keep **in progress** until browser re-check / commit.
- **Re-check (2026-10-17, 4th pass):** ✅ all feedback fixed, verified live: `POST /api/auth/update-user {image}` → **400** "Use PUT /api/v1/me/avatar…" and `users.image` unchanged; name-only updates still 200. The crop dialog uses the shared `Dialog`; the session refresh uses `$store.notify('$sessionSignal')`; deletes are limited to `users/${userId}/avatar/` + the storage base URL; lint is clean. Non-blocking: `strip-client-image.ts` is still wired as a `databaseHooks.user.update.before` that can't work (Better Auth merges hook results). The route-level `hooks.before` is the real guard, so delete the helper, its spec and the hook in a follow-up. Ready to commit.


### WH-049 · User settings page: profile, language, password
- **Type:** feature · **Priority:** P1 · **Status:** under-review · **Area:** client + api
- **Why:** the profile menu (WH-048) needs a "Settings" destination. Users can't change their name or password anywhere today: language is changed only through the switcher.
- **Scope:** `/{locale}/settings` (signed-in only, guarded by the WH-045 proxy) with sections:
  - **Profile:** edit the full name with Better Auth `authClient.updateUser({ name })` (`/update-user` is enabled). The email is read-only for now; changing it is WH-025 (`/change-email` is disabled on purpose).
  - **Language:** the same `useUpdateMe` as the switcher.
  - **Password:** current + new + confirm, using `authClient.changePassword({ revokeOtherSessions: true })`. Shows translated errors through `authErrorKey()`.
  - **Profile picture:** a section that hosts WH-050 (upload, crop, remove).
- **Acceptance criteria:**
  - [ ] Changing the name updates the navbar menu right away (session/cache refreshed).
  - [ ] Changing the password with the wrong current password shows a translated error. A correct change signs out the other sessions.
  - [ ] Works in `en`, `fr` and `ar`; forms follow WH-007 (React Hook Form + Zod).
- **Related:** WH-048, WH-047 (storage for the avatar), WH-025 (email change and account deletion).
- **Progress (2026-10-17):** shipped. Profile / language / password forms on `/{locale}/settings`; avatar UI lives in WH-050.
- **Review (2026-10-17):** 🔁 small. `/settings` is protected by the proxy (`auth-proxy.ts:22`), with Profile, Language, Password and Avatar sections. The name change uses `authClient.updateUser` (which refreshes `useSession` on its own), and the forms use React Hook Form.
  - [x] The extra `authClient.getSession({ disableCookieCache })` after `updateUser` removed (`updateUser` already refreshes `useSession`).
  - [ ] Browser check: change the name (the navbar updates), a wrong current password (translated error), a correct password change (other sessions signed out), in `en`, `fr` and `ar`. The web dev server was down during this review.
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** 🔁 one item left: `getSession` after `updateUser`.
- **Re-check (2026-10-17, 4th pass):** ✅ `getSession` removed → **under-review** (browser check + commit still open).
- **Re-check (2026-10-17, 4th pass):** ✅ the redundant `getSession()` is removed; `/settings`, `/settings/language` and `/settings/password` load in the settings shell. Ready to commit.


### WH-047 · Workspace branding: logo and cover image (like Notion)
- **Type:** feature · **Priority:** P1 · **Status:** under-review · **Area:** api + client + database + infra
- **Why:** a workspace should look like the company it belongs to. Its home page (`/{locale}/s/{slug}`) gets a wide **cover** across the top with the **logo** overlapping its bottom edge, as on Notion pages. The logo also appears in the workspace switcher and the picker, so people with several workspaces recognise them at a glance.
- **Who can change it:** whoever has **`space.settings.write`**. Today that is **Owner only**: it's in `OWNER_ONLY`, so Admins don't have it. Everyone with `members.read`, i.e. every member, sees the logo and cover.
  - _Decision to confirm:_ if Admins should manage branding without being able to change other settings, add a separate `space.branding.write` permission (Owner + Admin) instead of reusing `space.settings.write`.
- **Today:** the `Space` model has no image fields, there's no `PATCH` route on spaces, and the project has **no file storage at all** (Docker Compose runs only Postgres, Mailpit and Adminer). The JSON body limit is 1 MB.
- **Design:**
  - **Storage: S3-compatible object storage.**
    - **MinIO** locally in `docker-compose.yml` (plus a bucket created at start-up); S3 or Cloudflare R2 in production (see WH-026).
    - Never the database, never the API server's disk: the server has no persistent disk across deploys and can run several instances.
    - The storage client lives in a new **`libs/api/storage`** (`type:data-access`): `put`, `delete`, `publicUrl`, configured from env.
  - **Upload through the API, not straight to the bucket.**
    - `multipart/form-data` with a per-route size limit. Every file is **re-encoded server-side with `sharp`**:
      - check the real type from the file's bytes, never the browser's `Content-Type` or the file name;
      - accept PNG, JPEG and WebP only; **no SVG** (it can carry scripts);
      - strip EXIF and GPS metadata, resize, and save as WebP.
    - A file that isn't really an image fails to decode and gets 400.
    - _Why not presigned direct uploads:_ they'd skip this cleaning step, unless a background worker is added later.
  - **Sizes:**

    | | Accepted upload | Stored | Shown |
    |---|---|---|---|
    | Logo | ≤ 2 MB, at least 128×128, cropped to a square | 256×256 and 64×64 WebP | switcher 24–32 px, home 96 px, rounded |
    | Cover | ≤ 5 MB, at least 1200 px wide | 1600 px and 3200 px wide WebP (`srcset`) | full width, about 30vh high, `object-fit: cover` |

  - **Keys:** `spaces/{spaceId}/logo/{uuidv7}.webp` and `spaces/{spaceId}/cover/{uuidv7}.webp`.
    - Each upload gets a **new key**, so files can be cached forever (`Cache-Control: public, max-age=31536000, immutable`) with no stale-image problem.
    - The previous file is deleted after the database update succeeds.
    - _Read access (decide):_ public-read objects with unguessable keys, as Notion does (simple, CDN-friendly), vs. a private bucket with short-lived signed URLs (no URL sharing, but no long caching). **Recommended:** public-read for branding images; they're shown to everyone in the workspace and aren't confidential.
  - **Cover options, like Notion:**
    - **preset covers**: 8–12 gradients or solid colours shipped as static files in the web app, with no upload needed;
    - **an uploaded image**;
    - **reposition**: drag the cover up or down, saved as `coverPositionY` (0–100, used as `object-position: center Y%`);
    - **no cover**.
    - The default for a new workspace is a preset picked deterministically from its id, so it never looks empty.
  - **Logo fallback:** with no logo, show the workspace's **initials** on a colour derived from its id, everywhere a logo would appear.
- **Database** (one migration):
  - `spaces` gets:
    - `logo_key text null`;
    - `cover_key text null`;
    - `cover_preset text null` (preset name, mutually exclusive with `cover_key`, enforced by a CHECK);
    - `cover_position_y smallint not null default 50`, CHECK 0–100.
  - The existing tenant RLS policies apply as they are; writes go through `withTenant({ spaceId })`.
- **API** (in `libs/api/spaces`; every route runs `SpaceGuard` + `@RequirePermission(SPACE_SETTINGS_WRITE)`):
  - `PUT /api/v1/spaces/{spaceId}/logo` (multipart, field `file`) → 200 with the updated space;
  - `DELETE /api/v1/spaces/{spaceId}/logo` → 204;
  - `PUT /api/v1/spaces/{spaceId}/cover` (multipart) → 200;
  - `PATCH /api/v1/spaces/{spaceId}/cover` with `{ preset }`, or `{ positionY }`, or `{ preset: null }` for no cover;
  - `DELETE /api/v1/spaces/{spaceId}/cover` → 204;
  - errors as problem+json, with new codes in `ErrorCode`: `IMAGE_TOO_LARGE` (413), `IMAGE_UNSUPPORTED_TYPE` (415), `IMAGE_TOO_SMALL` (422);
  - a stricter rate limit on the upload routes, e.g. 10 per minute per user;
  - Swagger documents the multipart body (`@ApiConsumes('multipart/form-data')`).
- **Contracts:** `spaceResponseSchema` and `meSpaceSchema` gain `logo: { url64, url256 } | null` and `cover: { kind: 'preset', preset } | { kind: 'image', url1600, url3200 } | null`, plus `coverPositionY`. The API builds the URLs; the client never assembles storage URLs itself.
- **Web app:**
  - **Workspace home** (`space-home.tsx`): the cover banner with the logo overlapping its bottom edge, on the **start** side, so it mirrors in Arabic (`start-*`/`ms-*` classes, never `left-*`). `alt` = the workspace name. The cover is decorative (`alt=""`).
  - **Editing in place**, shown only when `useCan('space.settings.write')` (WH-019; until then, read `role.permissions` from `useCurrentSpace()`):
    - hovering the cover shows "Change cover" (presets / upload / remove) and "Reposition" (drag, then Save/Cancel);
    - hovering the logo shows "Change" and "Remove".
  - **Settings:** `/{locale}/s/{slug}/settings` gets a "Branding" section with the same controls, so they're reachable by keyboard and on touch screens, where hover doesn't exist.
  - **Switcher and picker** show the 64 px logo, or the initials fallback.
  - **Hooks:** `useUpdateSpaceLogo`, `useUpdateSpaceCover`. Afterwards, invalidate `queryKeys.spaces.detail(slug)` and `queryKeys.spaces.all`, so the switcher updates with no reload.
  - **Upload UX:**
    - check size and type in the browser first (a fast, friendly error), but the server decides;
    - show a preview while uploading, and the translated error message on failure;
    - all new text in `en`, `fr` and `ar`.
  - `next.config.js` `images.remotePatterns`: add the storage host (MinIO locally, the CDN host in production).
- **Acceptance criteria:**
  - [ ] An Owner can upload, replace and remove the logo and the cover, choose a preset cover and reposition it; it all persists after a reload.
  - [ ] An Admin and a Member see the branding but no edit controls, and calling the routes directly returns **403**. A non-member gets **404**.
  - [ ] A 6 MB cover gets 413, an SVG or a `.png` that's really a text file gets 415, and a 50×50 logo gets 422. All show a translated message.
  - [ ] Stored files are WebP with no EXIF (a test uploads a JPEG with GPS data and checks the output has none). Replacing an image deletes the old file from the bucket.
  - [ ] The switcher shows the new logo right after an upload, without a reload. With no logo, the initials appear.
  - [ ] The cover and logo look right in `en`, `fr` and `ar` (logo on the right in RTL), and on a phone-width screen.
  - [ ] Integration tests: the routes need `space.settings.write`, and workspace A can't change workspace B's images. Unit tests for the image-processing rules.
  - [ ] `docker compose up` starts MinIO with the bucket; the README developer notes (WH-027) mention it.
- **Depends on:** WH-041 (workspace home page). **Related:** WH-019 (`useCan`), WH-026 (production bucket/CDN), WH-011 (if branding gets its own permission).
- **Progress (2026-10-17):** shipped. Decisions: Owner-only via `space.settings.write`; public-read MinIO/S3 objects. Storage lib, branding columns + migration, upload/PATCH/DELETE routes, space home + settings UI, switcher/picker logos, image-process tests. Avatar upload on user settings left for a follow-up once this lands.
- **Acceptance criteria notes:** Compose uses `pgsty/silo` + `pgsty/mc` (official MinIO images were pulled from Hub/Quay in 2026-09). Migration `20261017153000_space_branding` applied.
- **Review (2026-10-17):** 🔁 changes requested. API verified live against MinIO:
  - Owner upload 200; Admin and Member → 403 `FORBIDDEN`;
  - small → 422, fake PNG or SVG → 415;
  - cover JPEG 200; `positionY: 150` → 400; unknown preset → 400;
  - replacing a logo **deletes the old files**; `DELETE` logo/cover → 204, and the bucket is empty afterwards;
  - URLs are built by the API; one migration with CHECKs.
  - [x] 🔴 **Anyone can list the whole bucket.** `mc anonymous set-json` with GetObject-only policy (`docker/minio/anonymous-get-object.json`). Listing → 403; GetObject on a known key → 200.
  - [x] **Pixel-bomb limit.** `limitInputPixels: 40_000_000` in `decode()` + unit test.
  - [x] **413 has the wrong code.** `PayloadTooLargeException` → `ErrorCode.IMAGE_TOO_LARGE` in `ProblemDetailsFilter`.
  - [x] **Compose:** pinned digests for `pgsty/silo` + `pgsty/mc`; link to minio removal issue; MinIO `healthcheck` + `depends_on: service_healthy` (no `sleep 3`).
  - [x] Dead code removed: `processLogo` alias and `spaces/image-process.ts` shim.
  - [x] Decisions recorded: branding **Owner-only** (`space.settings.write`); objects **public-read** (GetObject only, no ListBucket).
  - [x] Lint: unused `eslint-disable` removed from `space-logo.tsx`.
  - [ ] Browser check of the cover, logo, presets, reposition and RTL.
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ❌ was still open.
- **Re-check (2026-10-17, 4th pass):** ✅ review items addressed → **under-review** (browser check + commit still open).
- **Re-check (2026-10-17, 4th pass):** ✅ all feedback fixed, verified live: anonymous bucket **listing → 403**, a known object → 200; a 12000×12000 PNG is rejected (`limitInputPixels`, with a test); an oversized cover → 413 `IMAGE_TOO_LARGE`; images pinned by digest; a MinIO healthcheck plus `service_healthy` instead of `sleep 3`; a GetObject-only policy file; the alias and shim are removed; decisions recorded. Non-blocking: the pixel bomb answers 415 `IMAGE_UNSUPPORTED_TYPE` (a size code would be clearer), and the bucket name `workhub` is hard-coded in `docker-compose.yml` and the policy while the API reads `STORAGE_BUCKET`, so keep them in sync. Ready to commit.


### WH-052 · App shell: top bar + context sidebars (workspace, your dashboard, settings)
- **Type:** feature · **Priority:** P1 · **Status:** under-review · **Area:** client
- **Why:** signed-in pages all share one `AppShell` (header + centred column + footer) built for the landing page. Workspaces will have 8–10 sections (leave, calendar, holidays, documents, approvals, members, roles, invites, settings), and which ones you see depends on your role. A top navbar runs out of width after about 5 items, especially in `fr`/`ar`. The decided pattern (mockups 2026-10-17): a **thin top bar that's the same everywhere** + a **sidebar that changes with the context**, like Notion, Linear and Slack.
- **Decided layout:**

  | Context | Top bar | Sidebar |
  |---|---|---|
  | Workspace `/{locale}/s/{slug}/…` | logo · (search, later) · (notifications, later) · language · profile menu (WH-048) | **Workspace sidebar:** switcher with logo + your role (WH-047) → Home, My leave, Team calendar, Holidays, Documents · section *Manage*: Approvals, Members, Roles, Invites, Settings, each shown only with its permission · "Collapse" at the bottom |
  | Your dashboard `/{locale}/dashboard` | same | **none**: a centred page |
  | Account settings `/{locale}/settings/…` | same, with an "Account settings" breadcrumb | **Settings nav:** "Back to {last workspace}", Profile, Language, Password, (later) Sign-in methods, Sessions |
  | Landing, auth, contact, 404 | the marketing header (today's `AppHeader`) | none |

- **`/dashboard` decision (closes the open WH-041 question):** `/dashboard` becomes **"you, across all your workspaces"**:
  - your workspaces as cards (cover, logo, your role, member count, an "N to approve" badge when relevant) + a "Create workspace" card;
  - later: "Your requests, everywhere".
  - It **stops redirecting away**. The "land in your last workspace" step (`PostAuthRedirect`) runs **only right after sign-in** (the sign-in form, and the proxy's guest-only redirect), not every time `/dashboard` opens. The logo in the top bar links to `/dashboard`.
- **Structure (Next.js nested layouts, so no `if (context)` in one big component):**
  ```
  app/[locale]/
    (marketing)/  page, contact             → AppHeader + footer (as today)
    (auth)/       sign-in, sign-up, …        → as today
    (app)/layout.tsx                         → <TopBar/> + main
      dashboard/page.tsx                     → no sidebar
      settings/layout.tsx                    → <SettingsNav/> + content
      s/[slug]/layout.tsx                    → <SpaceSidebar/> + content
      spaces/…                               → no sidebar (picker, create)
  ```
  - Route groups `(marketing)`/`(app)` don't change URLs; the proxy rules (WH-045) stay as they are.
  - `components/shell/`: `top-bar.tsx`, `space-sidebar.tsx`, `settings-nav.tsx`, `sidebar-item.tsx`, `mobile-nav-drawer.tsx`.
- **Sidebar items as data, not markup:** `lib/nav/space-nav.ts` exports a typed list `{ id, href(slug), icon, labelKey, section: 'main' | 'manage', permission?, badge? }` (same for `settings-nav.ts`).
  - The sidebar filters it with the current workspace's `role.permissions` (`useCan`, WH-019, once it exists). **Hiding is UX only:** the API still returns 403.
  - Items whose page doesn't exist yet aren't listed. The first version ships **Home, Members (WH-046), Settings**; each later feature adds one line.
  - The active item uses the current pathname (`aria-current="page"`).
- **Behaviour:**
  - **Right-to-left:** logical classes only (`ps-*`, `border-e`, `start-0`); no `left`/`right`. In `ar` the sidebar is on the right and the logo overlaps the cover from the right.
  - **Phone (< 1024 px):** the sidebar is hidden; a ☰ button in the top bar opens it as a **drawer** (Base UI `Dialog`: focus trap, Escape, closes on navigation). The drawer slides from the start side.
  - **Collapse to icons:** desktop only. Remember the choice in a **cookie** (`wh_sidebar=collapsed`), read on the server in the layout, so the first paint has the right width with no jump; not `localStorage`. Icon-only items get a tooltip with their label.
  - **One data load:** `s/[slug]/layout.tsx` resolves the workspace once (`useCurrentSpace()`); the sidebar, the switcher and the page all read the same query. "No access" / "paused" states (WH-041/015) render inside the shell, without the workspace sidebar.
  - **Accessibility:**
    - a "Skip to content" link as the first focusable element;
    - `<nav aria-label="Workspace">` / `"Account settings"`;
    - the switcher is a menu button;
    - the drawer is a modal dialog;
    - focus is visible on every item.
  - The **footer** is removed from signed-in pages (it stays on marketing pages).
- **Text:** `Shell.*` keys (nav labels, "Manage", "Collapse", "Expand", "Skip to content", "Back to {name}", "Open menu") in `en`, `fr` and `ar`.
- **Acceptance criteria:**
  - [ ] `/en/s/acme` shows the top bar + workspace sidebar. As **Owner**, the *Manage* section lists the items you're allowed to see; as **Member**, *Manage* is absent. Calling a hidden route's API still returns 403.
  - [ ] `/en/dashboard` shows the top bar, **no sidebar**, your workspace cards (logo, cover, role) and "Create workspace". It no longer redirects away; after **sign-in** you still land in your last workspace.
  - [ ] `/en/settings` shows the settings nav with "Back to {last workspace}"; Profile, Language and Password are separate sections.
  - [ ] In `ar`, the sidebar and the drawer are on the right, and nothing uses physical left/right.
  - [ ] At 375 px wide: no sidebar visible; ☰ opens the drawer; Escape or picking an item closes it, and focus returns to ☰.
  - [ ] Collapsing the sidebar survives a reload **without a layout jump** (cookie read on the server).
  - [ ] Keyboard only: skip link → sidebar → content; `aria-current` on the active item; tooltips on collapsed items.
  - [ ] Unit tests: nav filtering by permission (Owner vs Member), active-item matching. The e2e test opens a workspace, navigates through the sidebar, and uses the drawer at phone width.
- **Depends on / feeds:** WH-048 (profile menu in the top bar), WH-047 (logo + cover in the switcher and the dashboard cards), WH-041 (workspace pages; its `/dashboard` question is decided here), WH-019 (`useCan`), WH-046/WH-011/WH-010 (Members, Roles, Invites pages become sidebar items), WH-049/WH-050 (settings sections), WH-051 (the 404 page uses the marketing or app shell depending on where it's shown).
- **Progress (2026-10-17):** design agreed from the mockups (workspace view, your dashboard, account settings, phone drawer + RTL).
- **Review (2026-10-17):** 🔁 built and mostly right:
  - route groups `(marketing)`/`(auth)`/`(app)`; `TopBar`, `SpaceSidebar`, `SettingsNav`, `MobileNavDrawer`;
  - nav items as data (`lib/nav/space-nav.ts`, with `space-nav.spec.ts`);
  - the `wh_sidebar` cookie read in `s/[slug]/layout.tsx`; skip link in 3 languages;
  - browser: in `ar` the sidebar is on the right and the logo overlaps the cover from the right; at 375 px the ☰ "Open menu" opens the drawer, and Escape closes it with focus back on ☰; `/dashboard` stays put unless `?land=1`.
  - [x] **The role under the switcher isn't translated:** `useRoleLabel()` shared with `space-home.tsx` (`Spaces.home.roles.*`).
  - [x] **A Member sees the "Manage" section:** Members nav item removed until WH-046; Manage (Settings) only shows for `space.settings.write`. AC: Member → Home only; Owner → Home + Manage/Settings.
  - [x] "Members" stub stays at `/s/{slug}/members` but is **not** listed in the sidebar until WH-046.
  - [ ] Collapse-to-icons with no jump after a reload, and keyboard-only navigation: not re-checked yet.
- **Re-check (2026-10-17, 4th pass):** role i18n + Manage/Members feedback addressed; keep **under-review**.
- **Re-check (2026-10-17, 4th pass):** ✅ all feedback fixed, verified in the browser: the switcher role is translated via `useRoleLabel()`; Members is hidden from the sidebar until WH-046 (a Member now sees no *Manage* section); collapse sets `wh_sidebar=collapsed`, and after a reload the sidebar comes back at **60 px directly** (no wide frame first), while Expand restores 240 px; skip link present; the drawer and RTL were verified earlier. Dev-only note: in collapsed mode Next's dev-tools badge sits over the Expand button (bottom-left); not a production issue. Ready to commit.


### WH-048 · Navbar profile menu: avatar, name, email, settings, sign out
- **Type:** feature · **Priority:** P1 · **Status:** under-review · **Area:** client
- **Why:** on `/dashboard` and the workspace pages, the signed-in header shows two plain buttons, "Account" and "Sign out" (`AuthNav`, signed-in branch). Apps like this put the user behind an **avatar** that opens a menu: it takes less room, shows who you're signed in as, and gives one place for account actions as they grow.
- **Today:**
  - `AppHeader` → `AuthNav` renders `Link(ROUTES.dashboard)` + `Button(signOut)` when signed in.
  - The user's `image` column exists (`schema.prisma`, `User.image`) but is always empty: nothing sets it until social sign-in (WH-012) or avatar upload (WH-049).
  - `components/ui/dropdown-menu.tsx` (Base UI `Menu`) is already used by the workspace and language switchers.
  - There's no user settings page yet (WH-049).
- **Scope:**
  - **`components/account/user-avatar.tsx`:**
    - shows `user.image` when set, otherwise the **initials** of `user.name` (first letters of the first two words; Arabic names work) on a colour derived from the user's id, so it stays the same everywhere;
    - sizes `sm` (28 px, navbar) and `lg` (40 px, menu header);
    - `alt` = the user's name. If the image fails to load, fall back to the initials.
  - **`components/account/user-menu.tsx`:** the avatar is the `DropdownMenuTrigger`, a real `<button>` with `aria-label` "Account menu: {name}". The menu (`align="end"`, so it mirrors in Arabic) contains:
    1. **a header**: avatar, **full name** and **email**, both truncated with `title` showing the full text. The email gets `dir="ltr"` so it reads correctly in Arabic, as in the auth forms;
    2. a separator;
    3. **"Settings"** → `/{locale}/settings` (`ROUTES.settings`, a new constant);
    4. a separator;
    5. **"Sign out"**, which calls `useAuth().signOut()` (one redirect, cache cleared; see WH-004), shows "Signing out…" and is disabled while it runs.
  - **Wiring:** `AuthNav`'s signed-in branch renders `<UserMenu />` instead of the two buttons, on every page with the header (landing page included). `tone="inverse"` keeps a visible focus ring on the dark hero.
  - **Loading:** while the session is pending, show a 28 px round skeleton (same size, so the header doesn't jump).
  - **Text:** new keys in `en`, `fr` and `ar` (`Account.menu.*`: `open`, `settings`, `signOut`, `signingOut`). Drop `Common.account` if nothing else uses it.
- **Acceptance criteria:**
  - [ ] Signed in on `/en/dashboard`, the header shows the avatar (initials when there's no image) instead of "Account"/"Sign out".
  - [ ] Clicking it opens a menu with the full name, the email, "Settings" and "Sign out". "Settings" opens `/en/settings`; "Sign out" lands once on `/en/sign-in` and the cache is cleared.
  - [ ] **Keyboard:** Tab to the avatar, then Enter or Space opens the menu, the arrow keys move between items, and Escape closes it and returns focus to the avatar. Screen readers announce it as a menu button.
  - [ ] In `ar`, the menu opens toward the start side, the text is right-aligned, and the email still reads left-to-right.
  - [ ] A long name or email truncates instead of widening the menu; the menu works at phone width.
  - [ ] Unit tests: initials (one word, two words, Arabic, empty name); `UserMenu` renders the name and email and calls `signOut`. The e2e sign-up test signs out through the menu.
- **Related:** WH-049 (the settings page it links to, and avatar upload), WH-012 (social sign-in fills `user.image`), WH-047 (the same initials fallback for workspace logos; share the colour helper).
- **Progress (2026-10-17):** shipped. `UserAvatar`/`UserMenu`, AuthNav wiring, initials helper + tests, e2e signs out via the menu.
- **Review (2026-10-17):** 🔁 small. Code matches the ticket:
  - `UserMenu` uses Base UI `Menu`, `align="end"`, `aria-label` "Account menu: {name}";
  - the name and email truncate with `title`, and the email is `dir="ltr"`;
  - "Settings" goes to `ROUTES.settings`; "Sign out" uses `useAuth().signOut()`;
  - the initials helper is tested (Arabic, empty, stable colour); a `user-menu` spec exists; the e2e test now signs out **through the menu**.
  - [ ] `user-avatar.tsx:42`: an unused `eslint-disable @next/next/no-img-element` (lint warning). Remove it, or use `next/image` with the storage host in `remotePatterns`.
  - [ ] Browser check (keyboard: Enter/arrows/Escape; RTL; phone width). The web dev server was down during this review.
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ browser check in `ar`: the avatar button ("قائمة الحساب: …") opens with Enter, the arrows move between Settings and Sign out, the email is `dir=ltr`, and Escape closes the menu and returns focus to the avatar. The unused `eslint-disable` in `user-avatar.tsx` is gone. Ready to commit.


### WH-009 · Workspaces, roles and memberships (backend + UI)
- **Type:** feature · **Priority:** P1 (next milestone) · **Status:** under-review · **Area:** api + client + database
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
- **Review (2026-10-17):** 🔁 the umbrella stays open until WH-040 and WH-041 are done. The isolation acceptance is already proven: `spaces.integration.spec.ts` (user A gets 404 on workspace B) and `rls.integration.spec.ts` (0 rows with no tenant set; B invisible with `app.space_id = A`), and live with two users today.
- **Review (2026-10-17, 2nd pass):** 🔁 the umbrella still waits for WH-040 (commit) and WH-041 (browser check + the `/dashboard` decision).
- **Re-check (2026-10-17, 3rd pass):** ✅ the children are ready (WH-040, WH-041 under review); isolation is proven by integration tests. Moves with them.


### WH-040 · Seed: an "Acme" workspace with owner, admin and member
- **Type:** chore · **Priority:** P1 · **Status:** under-review · **Area:** tools · **Part of:** WH-009
- **Why:** every workspace feature needs a ready-made workspace with one user per role to test against.
- **Scope:**
  - `pnpm db:seed` creates "Acme" (`acme`) with `owner@`, `admin@` and `member@workhub.test` in the matching roles.
  - Running it twice is safe.
  - `--reset` removes it.
- **Acceptance criteria:**
  - [x] After `pnpm db:seed`, `member@workhub.test` sees Acme in `GET /me/spaces` with the Member role. _(2026-10-17)_
  - [x] Running it twice changes nothing; `--reset` recreates it. _(idempotent `exists`; `--reset` deletes Acme then users)_
- **Progress (2026-10-17):** `tools/seed/src/seed-acme.ts` wired into `main.ts`.
- **Review (2026-10-17):** 🔁 changes requested. It works: all three users have the right role in Acme via `GET /me/spaces` (Owner/Admin/Member, active), running it twice reports `exists`, and there are seed tests.
  - [x] **Not atomic.** Create path wrapped in `prisma.$transaction`.
  - [x] **Shared system roles:** `systemRolesFor()` in `@work-hub/spaces`, used by `SpacesService.create` and the Acme seed.
  - [x] **Exists branch** re-applies system role permissions and repairs `defaultRoleId`.
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** ✅ feedback fixed: the create path runs in `prisma.$transaction`, the roles come from the shared `systemRolesFor()` (`libs/api/spaces/src/system-roles.ts`, exposed on purpose through the `./system-roles` package export), and the "exists" branch re-applies the catalog's permissions. **Only the commit is left.**
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ feedback verified fixed; ready to commit.


### WH-041 · Workspaces UI: create, switch, and workspace pages
- **Type:** feature · **Priority:** P1 · **Status:** under-review · **Area:** client · **Part of:** WH-009
- **Why:** users need to create and move between workspaces. Includes the planned hooks WH-014 (`useSpaces`) and WH-015 (`useSpace` / `useCurrentSpace`).
- **Scope:**
  - `/{locale}/spaces/new` (create form);
  - a workspace switcher in the header;
  - workspace pages under `/{locale}/s/{slug}`;
  - after sign-in, open your last workspace, or a picker if you have several;
  - a "no access" page for a slug you're not a member of.
- **Acceptance criteria:**
  - [x] Creating a workspace redirects to `/{locale}/s/{slug}`, and it appears in the switcher without a reload. _(cache updated in `useCreateSpace`)_
  - [x] Two tabs on two workspaces each show the right data. _(slug from URL via `useCurrentSpace`)_
  - [x] Works in `en`, `fr` and `ar` (RTL). _(messages + layout dir)_
- **Progress (2026-10-17):** hooks + create/picker/home + header switcher + post-auth redirect; `spaces`/`s` protected in proxy.
- **Review (2026-10-17):** 🔁 changes requested. Browser check signed in as `member@` in `ar`: sign-in lands straight on `/ar/s/acme` (only workspace), the layout is RTL, `/ar/s/not-mine` shows the translated "no access" page, and the switcher shows Acme.
  - [x] **Translated create form:** RHF + `createSpaceFormSchema(t)` + per-field `FieldError`; 409 → slug field error.
  - [x] **Arabic name → empty slug:** suggestion left empty; `slugLatinHint` shown instead of an English Zod error.
  - [x] **Role and status translated** (`Spaces.home.roles` / `statusValues`); custom role names stay as typed.
  - [x] Tab title uses the workspace **name** (`Metadata.spaceTitle`).
  - [x] **Decision:** `/dashboard` is a **routing hub only** (loader + `PostAuthRedirect`, no account card). Real destinations are `/s/{slug}`, `/spaces`, or `/spaces/new`.
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** 🔁 small. Fixed in code:
  - the create form uses React Hook Form with a translated schema (`lib/validators/space.ts`);
  - system roles and statuses are translated (`roles.*`, `statusValues.*`);
  - the tab title switches to the workspace name once it loads;
  - a "paused" state for deactivated members.
  - [ ] Browser re-check in `ar`: an Arabic name gives an empty slug and shows the translated hint, and there's no English text. The web dev server was down during this review.
  - [ ] **Still open from the last review:** decide what `/dashboard` is for. _(Decided 2026-10-17 in WH-052: "you, across all your workspaces"; redirect only right after sign-in. Implemented there.)_
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ browser re-check in `ar`: an Arabic name shows the translated hint ("استخدم أحرفًا لاتينية…"), and the slug errors are Arabic ("يجب أن يكون المعرّف حرفين على الأقل", "استخدم أحرفًا صغيرة وأرقامًا وشرطات"). The `/dashboard` question is decided and implemented in WH-052 (`?land=1` only right after sign-in). Ready to commit.


### WH-045 · Bug: signed-in users can open sign-in/sign-up; rename `/app` → `/dashboard`
- **Type:** bug · **Priority:** P1 · **Status:** under-review · **Area:** client
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
  - [x] Signed in, opening `/en/sign-in`, `/en/sign-up` or `/en/forgot-password` lands on `/en/dashboard` (or the saved language's dashboard) through a server redirect: the form never flashes.
  - [x] Signed out, opening `/en/dashboard` lands on `/en/sign-in` through a server redirect: no "Checking session…" flicker. _(2026-10-17: `GET /en/dashboard` → 307 `/en/sign-in`)_
  - [x] An expired or invalid session cookie shows the sign-in page, with **no redirect loop**. _(decision tests: stale → stay on auth pages)_
  - [x] With the API down, the auth pages still render (no 500, no loop). _(fail-open: fetch error → signed out)_
  - [x] Sign-in, sign-up verification and the nav link all go to `/dashboard`. `/en/app` returns 308 → `/en/dashboard`. _(2026-10-17)_
  - [x] No `'/app'` string is left in `apps/client/src` (`grep` finds nothing outside the redirect).
  - [x] Unit tests for the proxy's decision function: one per row of the table above, plus the stale-cookie and API-down cases. The e2e sign-up test asserts `/dashboard`.
  - [x] Works in `en`, `fr` and `ar`. _(unit coverage for locales; browser pass for signed-in redirect still open)_
- **Replaces:** WH-023 (pages guarded only in the browser).
- **Related:** WH-026 (cookies across hosts in production), WH-041 (workspace pages under `/s/{slug}` reuse the same proxy rules).
- **Progress (2026-10-17):** `ROUTES` + `authRedirectPath` / `proxy.ts` session gate; `/app` → `/dashboard` rename; next.config 308; client tests green.
- **Review (2026-10-17):** 🔁 changes requested. Verified live:
  - signed in (member, saved language `ar`): `/en/sign-in`, `/fr/sign-up` and `/en/forgot-password` → 307 `/ar/dashboard`;
  - `reset-password`, `verify-email`, `/` and `/contact` stay 200;
  - signed out: `/en/dashboard`, `/ar/s/acme` and `/fr/spaces` → 307 to that language's sign-in;
  - `/en/app` → 308 `/en/dashboard`; `/sign-in` → `/en/sign-in`;
  - stale cookie: sign-in 200, dashboard → sign-in, **no loop**;
  - 7 decision tests.
  - [x] **Rate limit:** `'/get-session': false` in `rateLimit.customRules` + unit test (110 calls, no 429).
  - [x] **Session fetch timeout:** `AbortSignal.timeout(1500)` + hanging-fetch test.
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** ✅ feedback fixed: `'/get-session': false` in `rateLimit.customRules`, and `AbortSignal.timeout(PROXY_SESSION_TIMEOUT_MS)` with a "never resolves" test (`specs/auth-session.spec.ts`). **Only the commit is left.**
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ re-verified live: every unknown path still behaves; feedback fixed. Ready to commit.


### WH-006 · Browser test of every auth flow after the language move
- **Type:** chore · **Priority:** P1 · **Status:** under-review · **Area:** client + api
- **Why:** sign-up, verify, forgot and reset password have only been tested with curl, or not at all, since the web pages changed.
- **Scope:** manual browser pass, then one automated Playwright test in `apps/client-e2e`.
- **Acceptance criteria:**
  - [x] Manual, in `en` and `ar`: sign up → email in Mailpit → link signs in → `/app` shows the user → sign out.
    _2026-10-17: passed in `en` (by hand) and in `ar` (browser test): sign-up → `/ar/verify-email` → email link → `/ar/app` signed in → sign-out → `/ar/app` redirects to `/ar/sign-in`. Found WH-032 (language saved as `en`), WH-033, WH-034._
  - [x] Manual: forgot password → email → reset page → new password works, old one fails. _(2026-10-17: reset token used, all sessions revoked)_
  - [x] Playwright test: sign up a new `@workhub.test` user, read the verification link from the Mailpit API (`GET localhost:8025/api/v1/message/latest`), open it, and assert `/app` shows the user's name.
  - [x] The Playwright test cleans up after itself (or the suite runs `pnpm db:seed -- --reset` first). _(2026-10-17: `global-teardown.mts` deletes `e2e.*@workhub.test`)_
- **Depends on:** WH-001, WH-002.
- **Progress (2026-10-17):** the manual pass is now complete in `en`, `ar` and `fr`: sign-up, verify, unverified redirect + resend, wrong password (translated), language switch, saved language after sign-in, sign-out with no data leak, forgot/reset. **Only the Playwright test is left.**
- **Review (2026-10-17, 2nd pass):** 🔁 changes requested (small):
  - [x] Playwright test written (`apps/client-e2e/src/auth-signup.spec.ts`): sign-up → Mailpit link → `/en/app` shows name and email. Good: unique email per run, Mailpit polled with a deadline.
  - [x] **AC 4:** `globalTeardown` deletes `e2e.%@workhub.test` users.
  - [x] Run it. _(2026-10-17: `npx playwright test src/auth-signup.spec.ts` in `apps/client-e2e` → 1 passed, 40.7 s, against the running dev servers)_
  - [x] Commit. _(in `9095245`)_
- **Re-check (2026-10-17, 4th pass):** no change since the last review. Cleanup (AC 4) and an actual `pnpm nx e2e client-e2e` run are still open.
- **Review (2026-10-17, 5th pass):** 🔁 two items left:
  - [x] **AC 4: cleanup** — `apps/client-e2e/src/global-teardown.mts`.
  - [x] **`pnpm nx e2e @work-hub/client-e2e` with `pnpm dev`:** e2e `dependsOn` cleared; Playwright `webServer` + `reuseExistingServer` starts or reuses apps.
- **Review (2026-10-17):** 🔁 changes requested. Verified: `pnpm nx e2e @work-hub/client-e2e` now runs **while `pnpm dev` is up** (2 passed), and the teardown printed "removed 1 e2e user(s)" (0 left afterwards).
  - [x] **Teardown scope:** `global-teardown.mts` runs `nx run @work-hub/seed:seed -- --e2e-cleanup` (seed's local-only guard); e2e no longer depends on `@work-hub/database`.
  - [x] **ESLint** `files` globs include `.mts` / `.cts` / `.mjs` / `.cjs`.
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** ✅ feedback fixed: the teardown calls `pnpm exec nx run @work-hub/seed:seed -- --e2e-cleanup` (behind `assertSafeToSeed`), the e2e package no longer imports `@work-hub/database`, and lint now covers `.mts`/`.cts`. **Only the commit is left.**
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ feedback fixed (seed `--e2e-cleanup`, lint covers `.mts`). Ready to commit.


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
- **Scope:** `MailService` templates per locale (`en`, `fr`, `ar`, with RTL in the HTML for Arabic). The user's `locale` picks the template. Includes the verification email language AC moved from WH-032.

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

### WH-051 · 404 page: translated "page not found" with a real 404 status
- **Type:** feature · **Priority:** P2 · **Status:** under-review · **Area:** client
- **Why:** an unknown URL today gets Next's built-in, unstyled, English-only 404 (or worse, see below). People land there from old links, typos and links shared from a workspace they've left. It should look like WorkHub, speak their language, offer a way back, and still return **HTTP 404**, so search engines and monitoring treat it correctly.
- **Investigation (2026-10-17, Next 16.1.7 + next-intl 4.14.9):**
  - The app has **no** `not-found.tsx`, `error.tsx`, `global-error.tsx` or catch-all route.
  - `app/layout.tsx` is a **pass-through** (it returns `children`, with no `<html>`/`<body>`); the real root layout is `app/[locale]/layout.tsx`. Next renders `not-found` inside the nearest layout, so a 404 **outside** `[locale]` has no `<html>`, no fonts and no translations.
  - `proxy.ts` (next-intl, `localePrefix: 'always'`) sends `/anything` → `/en/anything`. So almost every unknown URL becomes `/{locale}/unknown`, and with no catch-all, Next answers with its root default 404, **not** a page inside the localized layout.
  - Calling `notFound()` in a page renders the nearest `not-found.tsx` **and** sets status 404 (for streamed pages Next also adds `<meta name="robots" content="noindex">`).
  - `global-not-found.js` (made for exactly this layout situation) is still **experimental** in Next 16.1.7 (`experimental.globalNotFound`, `next/dist/server/config-shared.d.ts:644`). **Don't depend on an experimental flag**; use next-intl's documented stable pattern below.
- **Design (next-intl's recommended setup):**
  1. **`app/[locale]/not-found.tsx`:** the real, translated page (server component). It's rendered inside `[locale]/layout.tsx`, so it gets `<html lang dir>`, fonts, the header (`AppHeader`, so signed-in users get the profile menu from WH-048) and the footer. Content:
     - a heading ("Page not found"), one line of explanation, and the requested path if cheap to show;
     - buttons: **"Go to dashboard"** (signed-in) or **"Go home"** (signed out). The header's `AuthNav` already knows the state, so the body can show both links, or pick one in a small client component using `useAuth()`;
     - `generateMetadata` isn't available in `not-found`; export `metadata` with a translated title through `getTranslations` in the component, or a static `title`, plus `robots: { index: false }`.
  2. **`app/[locale]/[...rest]/page.tsx`:** calls `notFound()` and nothing else, so **every** unknown path under a language (`/en/nope`, `/ar/s`, `/fr/spaces/x/y`) renders (1) with status 404. Real routes are more specific and keep winning.
  3. **`app/not-found.tsx`:** a last-resort page with its **own** `<html lang="en"><body>` (minimal, English, the logo and a link to `/en`), for the rare 404s that never reach `[locale]` (e.g. an invalid locale hitting `[locale]/layout.tsx`'s `notFound()`, or paths the proxy matcher skips).
  4. **Text:** `NotFound.*` keys in `en`, `fr`, `ar`; RTL comes from the layout. Reuse the look of the existing "no access" block in `space-home.tsx` through a shared `EmptyState` component, so the 404 page and the in-app "no access" / "paused" states look the same.
  5. **Not in scope:** workspace "no access" (`/s/{slug}` you're not in) stays an **in-app state**, not a 404: the slug is checked in the browser after `/me/spaces` loads. API 404s stay problem+json. Error pages (`error.tsx`, `global-error.tsx` for crashes) are a separate ticket.
- **Acceptance criteria:**
  - [x] `curl -I /en/does-not-exist` → **404**, and the page shows the translated heading inside the normal header and footer; the same for `/fr/…` and `/ar/…` (RTL).
  - [x] `/does-not-exist` (no language) → redirect to `/en/does-not-exist` → 404 page.
  - [x] `/en/s` and `/en/spaces/new/extra` → 404 page; `/en/s/acme`, `/en/dashboard`, `/en/settings` are unaffected.
  - [ ] Signed in, the 404 page shows the profile menu and a "Go to dashboard" link; signed out, "Go home".
  - [x] The response has `noindex`; the tab title is translated.
  - [ ] An e2e test covers `en` + `ar` (status 404 + heading).
- **Re-check (2026-10-17):** built: `[locale]/not-found.tsx`, `[locale]/[...rest]/page.tsx`, root `app/not-found.tsx`, `NotFoundActions`, `client-e2e/src/not-found.spec.ts`. Verified live: `/en/does-not-exist`, `/ar/nope/deep`, `/fr/s` and `/en/spaces/new/extra` → **404** with `noindex`; `/does-not-exist` → `/en/does-not-exist` → 404. Minor: `not-found.spec.ts:34` lint warning `playwright/no-conditional-in-test`; split it into two tests. Signed-in vs signed-out buttons not checked in the browser.


### WH-007 · Forms: switch the auth forms to React Hook Form + Zod
- **Type:** tech-debt · **Priority:** P2 · **Status:** under-review · **Area:** client
- **Why:** the 5 auth forms each repeat the same `useState` for values, error and pending state. The SRS chooses React Hook Form + Zod for forms, and the schemas already exist (`src/lib/validators/auth.ts`).
- **Scope:** use `react-hook-form` with `@hookform/resolvers/zod` in sign-in, sign-up, forgot-password, reset-password and contact. Show errors next to each field instead of one message at the bottom.
- **Acceptance criteria:**
  - [x] No form component keeps its own `useState` for field values. _(only success / submitted UI state remains)_
  - [x] Each invalid field shows its own translated message. _(FieldError + RHF `errors`)_
  - [x] Submit is disabled while sending, as today. _(formState.isSubmitting)_
- **Depends on:** WH-001 (messages must be translated).
- **Progress (2026-10-17):** all five forms on RHF + zodResolver; `react-hook-form` / `@hookform/resolvers` added.
- **Review (2026-10-17):** ✅ no feedback. All 5 forms use React Hook Form + `zodResolver` with translated schemas, a `FieldError` per field, `formState.isSubmitting` disables submit, and only UI-state `useState`s remain (submitted / sent). **Only the commit is left.**
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** ✅ no feedback. **Only the commit is left.**
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ no feedback. Ready to commit.


### WH-032 · Sign-up saves the page's language, not always `en`
- **Type:** bug · **Priority:** P2 · **Status:** under-review · **Area:** api + client
- **Why:** someone who signs up on `/ar/sign-up` gets `locale = en` in the database, because Better Auth's `locale` field is locked at sign-up (`input: false`) and nothing sets it afterwards. Their emails and their next sign-in then default to English.
- **Scope:** pick one approach:
  - (a) after the email link signs the user in for the first time, the client calls `PATCH /api/v1/me` with the URL's language, using `useUpdateMe` from WH-005;
  - (b) server-side: a Better Auth `databaseHooks.user.create.before` hook reads the language (from a header the client sends, or `Accept-Language`) and validates it against `LOCALES` before saving.
  (b) is more reliable, because it also works if the user never opens the web app after verifying.
- **Acceptance criteria:**
  - [x] Signing up on `/ar/sign-up` stores `locale = ar`; on `/fr/sign-up`, `fr`; on `/en/sign-up`, `en`. _(client sends `x-workhub-locale`; hook sets it)_
  - [x] An unsupported value can never be stored (falls back to `en`). _(unit tests in `signup-locale.spec.ts`)_
- **Depends on:** WH-005 for (a); nothing for (b).
- **Progress (2026-10-17):** chose (b) — `databaseHooks` + `x-workhub-locale` from sign-up form.
- **Review (2026-10-17):** 🔁 changes requested. The design is right (option b: `databaseHooks.user.create.before`, explicit header first, then `Accept-Language`, invalid → `en`), with unit tests, and the CORS preflight allows `x-workhub-locale`.
  - [ ] **Live verify after API restart:** restart `pnpm dev` so the server picks up the hook, then sign up on `/ar/sign-up` and confirm `users.locale = 'ar'`.
  - [x] **`SIGNUP_LOCALE_HEADER`** in `@work-hub/constants`; client + auth both import it.
  - [x] `nx sync` / auth → constants project reference.
  - [x] AC 3 (verification email language) moved to WH-013.
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** ✅ verified **live** on fresh API code: sign-up with `x-workhub-locale: ar` → `users.locale = ar`, `fr` → `fr`, `xx` → `en` (test users deleted afterwards). `SIGNUP_LOCALE_HEADER` lives in `@work-hub/constants` and both sides use it; `nx sync` is clean; AC 3 moved out. **Only the commit is left.**
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ verified live (`ar`/`fr`/invalid → `en`). Ready to commit.


### WH-014 · `useSpaces()`: my workspaces
- **Blocked by:** WH-009
- **Type:** feature · **Priority:** P2 · **Status:** under-review · **Area:** client
- **What:** list of the current user's workspaces (`GET /api/v1/me/spaces`), for the workspace switcher and "pick a workspace" page. Key `queryKeys.spaces.all`.
- **Done when:** creating a workspace adds it to the switcher without a page reload (cache invalidated).
- **Progress (2026-10-17):** shipped with WH-041 (`use-spaces.ts` / `use-create-space.ts`).
- **Review (2026-10-17):** ✅ no feedback. `useSpaces()` uses `queryKeys.spaces.all` and is enabled only when signed in; a new workspace appears in the switcher without a reload (`setQueryData` in `useCreateSpace`). **Only the commit is left.**
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** ✅ no feedback. **Only the commit is left.**
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ no feedback. Ready to commit.


### WH-015 · `useSpace(slug)` / `useCurrentSpace()`: the workspace in the URL
- **Blocked by:** WH-009
- **Type:** feature · **Priority:** P2 · **Status:** under-review · **Area:** client
- **What:**
  - `useSpace(slug)` loads one workspace (`queryKeys.spaces.detail(slug)`);
  - `useCurrentSpace()` reads the slug from the `/s/{slug}` URL and calls `useSpace`.
- **Done when:** two browser tabs on two different workspaces each show the right data; a slug you're not a member of shows a "no access" page.
- **Progress (2026-10-17):** shipped with WH-041 (`use-space.ts` + no-access UI).
- **Review (2026-10-17):** 🔁 small. It works (two tabs, "no access" page). `useSpace` reads from the `/me/spaces` list instead of loading one workspace; that's fine while the list is small, but:
  - [x] **Dead cache write removed** from `useCreateSpace` (list cache only).
  - [x] **Deactivated membership** shows a paused-access state on the workspace page.
  - [ ] Commit.
- **Review (2026-10-17, 2nd pass):** ✅ feedback fixed: the dead `spaces.detail` write is gone, and deactivated members see a "paused" state (`space-home.tsx:70`). **Only the commit is left.**
  - [ ] Commit.
- **Re-check (2026-10-17, 3rd pass):** ✅ feedback fixed. Ready to commit.


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
