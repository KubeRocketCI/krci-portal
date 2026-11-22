# krci-portal

KubeRocketCI Portal — monorepo for a Kubernetes CI/CD platform UI.

## Agent skills

- Before filing or reading an issue, or opening a PR: `docs/agents/issue-tracker.md` (Jira `EPMDEDP`, PRs on GitHub).
- Before triage or labeling: `docs/agents/triage-labels.md` (default five labels).
- Before domain work: `GLOSSARY.md` (its terms go into code names, UI labels and notes), then the ADRs of the area in `docs/adr/` (`docs/agents/domain.md`, single-context).

## Critical Conventions

- All tRPC endpoints use `protectedProcedure` (never `publicProcedure`)
- All tRPC inputs validated with Zod schemas (no raw string params)
- K8s API calls use `idToken` as bearer — never service account tokens (except Tekton Results client)
- **SA token login** is the one sanctioned exception to both rules above: the pre-session `loginWithServiceAccountToken` `publicProcedure` passes a raw SA token as the K8s bearer via `K8sClient.fromToken()` → `getSelfSubjectReview()` to validate it (that call *is* the auth step); every other K8s call still uses the session `idToken`, so don't flag it.
- CEL filter strings: validate with the shared `validateCELFilter` and build literals with `toCELStringLiteral` (`packages/shared` tektonResults); the tRPC `celFilter` schema and the Tekton Results client both run the validator
- Mutation pattern: `structuredClone()` + mutate (not functional filter); `no-param-reassign` is OFF
- Shared labels/constants go under the K8s resource type they apply TO (e.g., Pod labels in `Core/Pod/labels.ts`)

## Security — Never

- Expose `idToken` or session secrets in client bundles
- Use `publicProcedure` for any endpoint accessing K8s (except SA token login above)
- Interpolate unsanitized user input into CEL filter strings
- Skip Zod validation on tRPC inputs
