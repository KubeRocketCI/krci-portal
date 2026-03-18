# CLAUDE.md

## Project

KubeRocketCI Portal — monorepo for a Kubernetes CI/CD platform UI.

## Structure

```
apps/client    — React 19 SPA (Vite, Radix UI, Tailwind, TanStack Router/Query/Form)
apps/server    — Express + tRPC v11 (session: SQLite, auth: OIDC via Keycloak/Azure AD)
packages/trpc  — tRPC routers, procedures, Kubernetes API clients
packages/shared — shared types, models, K8s resource interfaces
```

## Commands

- `pnpm build` — build all (shared → trpc → server → client)
- `pnpm tsc:check` — TypeScript validation
- `pnpm lint:check` — ESLint
- `pnpm test:coverage` — Vitest
- `pnpm format:check` — Prettier

## Critical Conventions

- All tRPC endpoints use `protectedProcedure` (never `publicProcedure`)
- All tRPC inputs validated with Zod schemas (no raw string params)
- K8s API calls use `idToken` as bearer — never service account tokens
- CEL filter strings: client uses `escapeCELString()`, server uses regex-constrained Zod
- Mutation pattern: `structuredClone()` + mutate (not functional filter); `no-param-reassign` is OFF
- Shared labels/constants go under the K8s resource type they apply TO (e.g., Pod labels in `Core/Pod/labels.ts`)

## Security — Never

- Expose `idToken` or session secrets in client bundles
- Use `publicProcedure` for any endpoint accessing K8s
- Interpolate unsanitized user input into CEL filter strings
- Skip Zod validation on tRPC inputs
