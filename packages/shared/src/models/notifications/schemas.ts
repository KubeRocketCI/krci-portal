import { z } from "zod";

/** Matches the Snackbar toast variants 1:1 so severity needs no translation layer. */
export const notificationSeveritySchema = z.enum(["info", "success", "warning", "error"]);

/**
 * Payload the in-cluster Argo Events Sensor POSTs to `POST /rest/v1/internal/events`.
 * `id` is the idempotency key — re-delivering the same `id` is a no-op.
 *
 * Evolution policy (the Sensor deploys independently of the portal, so
 * mismatched versions must interoperate):
 * - Unknown fields are ignored (Zod strips them) — never switch to `.strict()`.
 * - New fields must be `.optional()`; the required-field set below is frozen.
 * - Enum widening is portal-first: release the widened portal before any
 *   Sensor sends the new value (unknown enum values are rejected with 400).
 * - Constraints may only be loosened, never tightened, once a Sensor relies
 *   on them. Max lengths bound storage/UI, they are not business rules.
 *
 * The golden fixture in apps/server/src/config/__fixtures__ pins the exact
 * deployed-Sensor payload via the contract test.
 */
export const notificationEventSchema = z.object({
  id: z.string().min(1).max(512),
  type: z.string().min(1).max(256),
  severity: notificationSeveritySchema,
  title: z.string().min(1).max(512),
  body: z.string().min(1).max(4096),
  namespace: z.string().min(1).max(253),
  // Open-redirect guard: the client router navigates here on click, so only
  // app-relative paths are allowed. The lookahead also rejects "//host" and
  // its backslash equivalent "/\host" (WHATWG parsers normalize "\" to "/"),
  // both of which a bare startsWith("/") would admit.
  link: z
    .string()
    .regex(/^\/(?!\/|\\)/, "must be an app-relative path")
    .max(2048)
    .optional(),
  timestamp: z.string().min(1).max(64),
});
