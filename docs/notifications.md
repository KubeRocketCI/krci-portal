# Notifications Hub (alpha)

In-portal notifications fed by an in-cluster Argo Events Sensor. This page
documents the alpha contract, its operational story, and the limitations that
are deliberate for v1.

## Architecture

```
Argo Events Sensor ──POST /rest/v1/internal/events──▶ Fastify (raw route)
      (in-cluster,                                        │
   x-internal-events-token)              Zod-validate → SQLite insert (idempotent on id)
                                                          │
                                            in-process EventEmitter fan-out
                                                          │
                              tRPC `notifications.subscribe` (WS, per logged-in client)
                                                          │
                                    NotificationBell (badge, popover, toast)
```

- **Ingestion**: `apps/server/src/config/openapi.ts` (`POST /rest/v1/internal/events`).
  Raw Fastify route — deliberately outside tRPC session auth; authenticated by
  the `x-internal-events-token` shared-secret header (timing-safe compare
  against `INTERNAL_EVENTS_TOKEN`). ClusterIP-only exposure plus a 32 KiB body
  limit keep the abuse surface proportionate.
- **Contract**: `packages/shared/src/models/notifications/schemas.ts` — the
  evolution policy (tolerant reader, optional-only additions, portal-first enum
  widening) is documented on the schema itself. A golden fixture of the exact
  Sensor payload lives in
  `apps/server/src/config/__fixtures__/argo-events-notification.json`, pinned
  by contract tests in `apps/server/src/config/openapi.internalEvents.test.ts`.
  The endpoint is published in the dev OpenAPI document
  (`/rest/v1/openapi.json`, path `/v1/internal/events`); a drift-guard test
  keeps the hand-authored OpenAPI schema in sync with the Zod schema.
- **Storage**: `apps/server/src/clients/db-notifications-store` —
  better-sqlite3, `notifications` + per-user `notification_reads`. Retention is
  7 days, enforced at startup/shutdown and opportunistically on insert (at most
  hourly), matching the session store's no-scheduler approach.

## Operations

- **Enabling**: the endpoint responds `503` until `INTERNAL_EVENTS_TOKEN` is
  set (see `deploy-templates/values.yaml` for the Secret + `extraEnvFrom`
  wiring). Unconfigured installs are unaffected.
- **Token rotation**: the server reads the token from the environment on every
  request, but Kubernetes injects Secret-backed env vars only at container
  start — rotation is: update the Secret, update the Sensor's copy, then
  `kubectl rollout restart` the portal. No code or chart change needed.

## Known limitations (accepted for alpha)

1. **No namespace-scoped visibility** — every authenticated portal user sees
   every notification, regardless of their Kubernetes RBAC in the source
   namespace. Read/unread state is per-user; the event stream is global.
   *Plan*: reuse the portal's RBAC-delegation pattern — a
   `SelfSubjectAccessReview` (verb `list`, resource `pipelineruns` or the
   notification's source kind) per distinct `namespace`, executed with the
   user's own `idToken` and cached per session (the same shape as the client's
   `usePermissions` checks). `notifications.list` filters rows through that
   cache; `notifications.subscribe` drops events for namespaces the cache
   denies. Not implemented now because the subscribe path is a synchronous
   event-queue generator shared by all users — inserting per-event async
   authz there is a new layer, not a gate, and alpha's notification sources
   (pipeline events) are visible to all portal roles in practice.
2. **Single replica only** — SQLite file storage and the in-process
   EventEmitter both assume one server pod (`replicaCount: 1`, the chart
   default). Scale-out requires Postgres (per the krci-audit pattern) and a
   shared pub/sub; deferred until there is a real multi-replica need.
3. **Free-form `type` taxonomy** — `type` is an unconstrained string; the
   planned notification-preferences feature will introduce the controlled
   vocabulary. Until then, consumers must not switch on `type`.
4. **No per-user subscriptions/preferences** — everyone gets every event
   (toast included). Same future feature as above.
5. **Unread badge counts the fetched window only** — the bell fetches the
   latest 20 notifications; with >20 unread the badge undercounts. Acceptable
   while retention is 7 days and volume is low; pagination (`before` cursor)
   is already supported by the store interface.
