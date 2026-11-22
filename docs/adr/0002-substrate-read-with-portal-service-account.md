# Agent Substrate is read with the portal ServiceAccount, and every signed-in user sees all of it

Agent Substrate accepts only JWTs from issuers in its `ate-api-authentication` ConfigMap and grants roles to single principals, never to groups. The portal reads the Substrate gRPC API with a token of its own ServiceAccount (audience `api.ate-system.svc`), bound to the global `viewer` role. The procedures are `protectedProcedure`: every signed-in user sees every atespace, actor and worker. The read is read-only.

This is an exception to the rule that the portal calls Kubernetes with the user's `idToken`: the Substrate API is not the Kubernetes API, and Kubernetes reads (`WorkerPool`, `Codebase`) still use the user's `idToken`.

## Considered options

- The user's Keycloak token passed to Substrate: needs a Keycloak entry in every cluster's Substrate config and one access-policy entry per user. Rejected for the alpha.

## Consequences

- Per-team visibility needs a portal-side filter (by Codebase RBAC) or per-user Substrate grants. Neither exists in the alpha.
