# WorkHub architecture

## Repository layout

```
apps/
  server/src/                  wiring only — no business logic
    main.ts                    helmet, CORS, /api/v1 prefix, Swagger
    app.module.ts              imports domain modules; global guard/filter/pipe
    config/                    env schema → typed AppConfig
    swagger/                   builds the OpenAPI document
    health/                    /health/live, /health/ready
  client/                      Next.js
  client-e2e/                  Playwright: critical flows only
libs/
  api/                         scope:api
    users/        feature      GET/PATCH /me
    spaces/       feature      /spaces, /me/spaces
    access/       feature      SpaceGuard, @RequirePermission, SpaceAccess
    auth/         data-access  Better Auth instance
    database/     data-access  Prisma, withTenant, migrations, RLS
    mail/         data-access  sending + templates
    core/         util         ProblemDetailsFilter, Swagger constants (no DB)
  shared/                      scope:shared (server + client)
    contracts/    util         Zod request/response schemas
    constants/    util         error codes, permissions, locales
tools/                         seed, backlog, dev
docs/
CODEOWNERS
```

## Dependency rules

Enforced by `@nx/enforce-module-boundaries` in `eslint.config.mjs`:

| Tag | May import |
|---|---|
| `type:app` | `feature`, `data-access`, `util` |
| `type:feature` | `feature`, `data-access`, `util` |
| `type:data-access` | `data-access`, `util` |
| `type:util` | `util` only |
| `type:tool` | `feature`, `data-access`, `util` |
| `type:e2e` | `app`, `feature`, `data-access`, `util` |
| `scope:api` | `scope:api`, `scope:shared` |
| `scope:client` | `scope:client`, `scope:shared` |
| `scope:shared` | `scope:shared` only |

A project must satisfy **both** its `type:*` and `scope:*` rows. Feature code is imported only through each library’s `index.ts` (package `exports`).

## Domain library shape

```
libs/api/<domain>/src/
  index.ts                 public API (Module; service only if another domain needs it)
  <domain>.module.ts
  controllers/             HTTP: routes, Swagger, guards
  <domain>.service.ts      business rules; tenant queries use withTenant()
  dto/                     nestjs-zod DTOs from @work-hub/contracts
  *.spec.ts
  *.integration.spec.ts    real Postgres when needed
```

## How to add a domain

1. Create the library:

   ```bash
   pnpm nx g @nx/nest:library libs/api/<name> --tags=scope:api,type:feature
   ```

   Use `type:data-access` or `type:util` instead when that fits better.

2. Follow the folder shape above; export only from `index.ts`.
3. Import the module in `apps/server/src/app.module.ts`.
4. Add Zod schemas to `libs/shared/contracts` and shared enums/permissions to `libs/shared/constants`.
5. Add a `CODEOWNERS` line for `libs/api/<name>/`.
6. Run `pnpm nx sync` and `pnpm nx run-many -t typecheck lint test`.
