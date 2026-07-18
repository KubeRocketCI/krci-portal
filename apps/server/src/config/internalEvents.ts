import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  notificationEventSchema,
  type INotificationsStore,
} from "@my-project/shared";
import { notificationEventBus } from "@my-project/trpc";

// Env-sourced token only changes on restart, so its digest is cached.
let cachedConfiguredToken: string | undefined;
let cachedConfiguredHash: Buffer | undefined;

// Hashing both sides before `timingSafeEqual` avoids its length-mismatch
// throw (the header can be any length) while staying constant-time.
function tokensMatch(provided: string, configured: string): boolean {
  if (configured !== cachedConfiguredToken) {
    cachedConfiguredToken = configured;
    cachedConfiguredHash = createHash("sha256").update(configured).digest();
  }
  const providedHash = createHash("sha256").update(provided).digest();
  return timingSafeEqual(providedHash, cachedConfiguredHash as Buffer);
}

/**
 * POST /rest/v1/internal/events — ingestion endpoint for the in-cluster Argo
 * Events Sensor. Lives outside `openapi.ts` (the tRPC REST proxy) because it
 * deliberately bypasses tRPC session auth: the caller is a cluster workload,
 * authenticated via the INTERNAL_EVENTS_TOKEN shared-secret header instead.
 *
 * Token rotation = update the Secret (portal + Sensor) and rollout-restart:
 * Kubernetes injects Secret-backed env vars only at container start.
 *
 * Published in the dev OpenAPI document via a hand-authored entry in
 * `openapi.ts`, kept in sync by the contract test.
 */
export function registerInternalEventsRoute(
  fastify: FastifyInstance,
  opts: { notificationsStore: INotificationsStore }
) {
  const { notificationsStore } = opts;

  // 32 KiB is far above any valid event (~10 KB max per the schema) but
  // bounds what an unauthenticated caller can make Fastify buffer and parse.
  fastify.post<{ Body: unknown }>(
    "/rest/v1/internal/events",
    { bodyLimit: 32 * 1024 },
    async (req, res) => {
      const configuredToken = process.env.INTERNAL_EVENTS_TOKEN;
      if (!configuredToken) {
        return res.code(503).send({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "INTERNAL_EVENTS_TOKEN is not configured",
          },
        });
      }

      const providedToken = req.headers["x-internal-events-token"];
      if (
        typeof providedToken !== "string" ||
        !tokensMatch(providedToken, configuredToken)
      ) {
        return res.code(401).send({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing token",
          },
        });
      }

      const parsed = notificationEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.code(400).send({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid notification event",
            issues: parsed.error.issues,
          },
        });
      }

      notificationsStore.insert(parsed.data);
      notificationEventBus.publish(parsed.data);

      return res.code(204).send();
    }
  );
}
