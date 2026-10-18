# WorkHub

Multi-tenant SaaS for small and mid-size companies to manage leave, public holidays, and HR document requests in one place.

**Problem.** Leave lives in spreadsheets, WhatsApp, and email. Balances drift, approvals get lost, and employees wait days for a salary certificate or work attestation.

**Vision.** One link to join your company, one screen to see who is off, one click to request a day off or a document, and a clear audit trail of every decision.

> Product and engineering detail: [PRD](docs/WorkHub%20—%20Product%20Requirements%20Document%20(PRD).md) · [SRS](docs/WorkHub%20—%20Software%20Requirements%20Specification%20(SRS).md)

## Product scope (v1)

- **Spaces** — company workspaces; one user can belong to many spaces with different roles
- **Join** — invite link, email invite, or verified company email domain
- **Leave bank** — balances per leave type, team visibility (including leave type)
- **Leave & holidays** — requests with manager approval, denial, and comments; public and company holidays
- **Documents (“papers”)** — work/salary certificates, payslip copies, and similar HR requests
- **Profiles** — employee and employment fields with role-based access

**Out of scope for v1:** payroll calculation, time tracking / attendance, recruitment (ATS), native mobile apps (responsive web only).

### Roles (per space)

| | Owner | Admin / HR | Manager | Employee |
| --- | --- | --- | --- | --- |
| Space settings & billing | ✓ | | | |
| Members, roles, teams | ✓ | ✓ | | |
| Leave policies & balances | ✓ | ✓ | | |
| Approve team leave | ✓ | ✓ | ✓ | |
| Fulfil document requests | ✓ | ✓ | optional | |
| Team leave bank & calendar | ✓ | ✓ | ✓ | ✓ |
| Own requests & profile | ✓ | ✓ | ✓ | ✓ |

### Success target

A ~20-person company should onboard in under 10 minutes and process leave and document requests inside WorkHub within the first month. Median request-to-decision time: under 24 hours.

## Stack (planned)

| Layer | Choice |
| --- | --- |
| Monorepo | Nx + pnpm |
| Web | Next.js (App Router), Tailwind, shadcn/ui, TanStack Query |
| API | NestJS (REST + OpenAPI) |
| Worker | NestJS + BullMQ (accruals, emails, reminders) |
| Database | PostgreSQL 16 + Prisma (or Drizzle), row-level security |
| Auth | Email/password, Google, Microsoft |
| i18n | English + Arabic (RTL) at launch; French in v1.1 |
| Infra | Docker locally; Vercel (web) + Railway / Fly / ECS (API) |

## Planned monorepo layout

```
workhub/
  apps/
    web/          # Next.js
    api/          # NestJS REST API
    worker/       # BullMQ jobs & cron
  libs/
    shared/       # contracts, constants, utils
    api/          # domain modules (spaces, leaves, documents, …)
    web/          # UI, data-access, feature screens
  docs/           # PRD, SRS
  docker-compose.yml
```

## Documentation

| Doc | Purpose |
| --- | --- |
| [Product Requirements (PRD)](docs/WorkHub%20—%20Product%20Requirements%20Document%20(PRD).md) | Vision, personas, features, flows, release plan |
| [Software Requirements (SRS)](docs/WorkHub%20—%20Software%20Requirements%20Specification%20(SRS).md) | Stack, architecture, FRs, data model, API, NFR |

## Local development

```bash
# copy apps/server/.env.example → apps/server/.env and apps/client/.env.example → apps/client/.env first
docker compose --env-file apps/server/.env up -d   # Postgres :5434, Mailpit :8025, Adminer :8083, MinIO :9000 (console :9001)
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev                      # web :3000 + API :3333
```

Object storage (WH-047) uses **pgsty/silo** (S3-compatible; the old `minio/minio` images are no longer public). Root user / password / bucket come from `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, and `STORAGE_BUCKET` in `apps/server/.env` (defaults: `workhub` / `workhubsecret` / `workhub`, public-read). Console: http://localhost:9001.

### CI

[![CI](https://github.com/msaouab/WorkHub/actions/workflows/ci.yml/badge.svg)](https://github.com/msaouab/WorkHub/actions/workflows/ci.yml)

On every push to `main` and every pull request, GitHub Actions runs:

1. **Quality + integration** — `pnpm quality` (backlog rules, `nx sync:check`, typecheck/lint/test, knip, unused translation keys) against Postgres 16 with migrations applied. The commit gate (`--gate`) is **not** used in CI; review state is local.
2. **Playwright e2e** — builds the client and API, starts Mailpit + MinIO, seeds Acme, and runs `@work-hub/client-e2e` against the built apps.

Local e2e: start `pnpm dev`, then `pnpm nx e2e @work-hub/client-e2e` (one worker; signs in once per seed role via the API).

## Status

Greenfield — implementation starts from this repo. Specs in `docs/` are the source of truth for v1.
