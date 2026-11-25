# krci-portal

KubeRocketCI Portal — monorepo for a Kubernetes CI/CD platform UI.

## Agent skills

- Before filing, reading or closing an issue, or opening a PR: `docs/agents/issue-tracker.md` (Jira `EPMDEDP`, PRs on GitHub). A close always sets resolution Done.
- Before triage or labeling: `docs/agents/triage-labels.md` (default five labels).
- Before domain work: `GLOSSARY.md` (its terms go into code names, UI labels and notes), then the ADRs of the area in `docs/adr/` (`docs/agents/domain.md`, single-context).
- Portal feature: the `mattpocock-skills` flow (grilling with domain-modeling, then `/implement` driving `/tdd`). Before portal code (component, table, filter, form, route, K8s resource, tRPC endpoint, test): load the matching `krci-fullstack` skill; it holds the patterns and rules. The `krci-fullstack:fullstack-dev` agent is for a side task only.
- After each TDD slice: `pnpm vitest run --project <package> <module directory>` and `pnpm --filter=<package> tsc`. Coverage is off unless `--coverage` is passed.
- Before each commit: `pnpm check:changed`, a targeted subset (changed packages, and the tests in the import graph of the change). `.githooks/pre-commit` (set by `pnpm install`) blocks a commit on `main` and a commit whose staged contents are not formatted.
- Format with `pnpm check:changed` or `pnpm --filter=<package> format`, never the root Prettier binary on package files: Prettier reads `.prettierignore` and its plugins from the directory it runs in.
- Before you hand over a push command: `git fetch`, rebase on `origin/main`, then `pnpm check:changed` after the last change.
- After a change in `packages/shared` or `packages/trpc`, before `tsc` or a build: `pnpm --filter=shared build && pnpm --filter=trpc build`. `tsc` in trpc, server and client reads `packages/shared/dist`; trpc tests read shared from source. At runtime trpc reads shared from an injected copy (`injectWorkspacePackages`).

## Critical Conventions

- All tRPC endpoints use `protectedProcedure` (never `publicProcedure`)
- All tRPC inputs validated with Zod schemas (no raw string params)
- K8s API calls use `idToken` as bearer — never service account tokens (except Tekton Results client)
- **SA token login** is the one sanctioned exception to both rules above: the pre-session `loginWithServiceAccountToken` `publicProcedure` passes a raw SA token as the K8s bearer via `K8sClient.fromToken()` → `getSelfSubjectReview()` to validate it (that call _is_ the auth step); every other K8s call still uses the session `idToken`, so don't flag it.
- **Agent Substrate read** (ADR 0002): the portal ServiceAccount token, as for Tekton Results, but a projected token with audience = the `AGENT_SUBSTRATE_URL` host (`/var/run/agent-substrate/token`). Agent Substrate rejects the default token (kube-apiserver audience). Agent Substrate is not the K8s API; K8s reads for Factory mode (`WorkerPool`, `Codebase`) use the session `idToken`, so don't flag it.
- CEL filter strings: validate with the shared `validateCELFilter` and build literals with `toCELStringLiteral` (`packages/shared` tektonResults); the tRPC `celFilter` schema and the Tekton Results client both run the validator
- Mutation pattern: `structuredClone()` + mutate (not functional filter); `no-param-reassign` is OFF
- Shared labels/constants go under the K8s resource type they apply TO (e.g., Pod labels in `Core/Pod/labels.ts`)
- Table cells: links via `CellLink` / `CellExternalLink`, text as a string or `TextWithTooltip` (an element without them clips with no tooltip); filter matchers from `core/providers/Filter/matchFunctions`; detail tabs via the shared `Tabs`
- Comments state only what the code cannot show: a cross-file fact, a constraint, a surprising default; the checkable rule is in `CONTRIBUTING.md` (TypeScript Styleguide)

## Security — Never

- Expose `idToken` or session secrets in client bundles
- Use `publicProcedure` for any endpoint accessing K8s (except SA token login above)
- Interpolate unsanitized user input into CEL filter strings
- Skip Zod validation on tRPC inputs
