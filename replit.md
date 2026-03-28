# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Security**: helmet, express-rate-limit, express-validator, custom OWASP threat engine

## Security Architecture

### Frontend Layer (HTTP Headers)
- **helmet** — Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, etc.
- **Cache-Control** — no-store/no-cache for sensitive responses
- **CORS hardening** — origin whitelist (localhost, replit.app, replit.dev, repl.co), credentials, explicit method/header allowlists

### Middle Layer (Real-Time Threat Detection)
- **SQL Injection** — UNION, DROP, OR 1=1, SLEEP(), BENCHMARK(), information_schema, xp_cmdshell, char(), cast(), convert()
- **XSS** — `<script>`, `javascript:`, inline event handlers, iframe/object/embed, eval(), document.cookie, vbscript
- **Command Injection** — shell metacharacters, $(), backticks, piped shell names
- **Path Traversal** — ../, %2f, /etc/passwd, /proc/self, Windows paths
- **OAuth Attacks** — javascript: redirect_uri, data: redirect_uri, open redirect
- **NoSQL Injection** — $where, $ne, $gt, $lt, $regex, $exists, $elemMatch
- **Auto-sanitization** — medium/low threats are rewritten in-place, critical/high are blocked (400)
- **Threat log** — in-memory audit log (last 1000 events) with severity, IP, path, matched patterns

### Backend Layer (Request Hardening)
- **Rate limiting** — 200 req/15min global, 20 req/15min strict routes, 10 req/15min auth routes
- **Request size limit** — 1MB max body (Content-Length check before parsing)
- **Content-Type validation** — rejects unknown media types on POST/PUT/PATCH
- **Session hardening** — strips server fingerprint headers (Server, Via, X-Powered-By)
- **Trust proxy** — correct IP extraction behind Replit's proxy

### API Endpoints
- `GET /api/healthz` — health check (rate-limit excluded)
- `POST /api/security/scan` — scan a payload for threats, returns safe/unsafe + matched patterns
- `GET /api/security/threats` — list recent threat log entries (last 100)
- `GET /api/security/threats/stats` — aggregate counts by type and severity

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server (hardened)
│       └── src/
│           ├── middlewares/
│           │   ├── security-headers.ts   # Helmet CSP/HSTS/framing
│           │   ├── rate-limiter.ts       # Global + route-level rate limits
│           │   ├── threat-detector.ts    # OWASP pattern scanner + sanitizer
│           │   └── session-hardener.ts   # Header stripping + content-type + size
│           ├── lib/
│           │   ├── logger.ts             # Pino structured logger
│           │   └── threat-store.ts       # In-memory threat audit log
│           └── routes/
│               ├── health.ts             # GET /healthz
│               └── security.ts          # POST /scan, GET /threats, GET /threats/stats
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`).
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Hardened Express 5 API server. Security middleware is layered in `src/middlewares/`. Routes live in `src/routes/`.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts security headers → session hardener → CORS → rate limiter → size/content-type → JSON parsing → threat detector → routes
- Routes: `src/routes/index.ts` mounts sub-routers
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run with required PORT

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Run via `pnpm --filter @workspace/scripts run <script>`.
