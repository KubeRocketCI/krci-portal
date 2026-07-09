import { createRoute } from "@tanstack/react-router";
import { adminLayoutRoute } from "@/core/router/routes";

export const PATH_ADMIN_AUDIT_EVENTS = "administration/audit-events" as const;
export const PATH_ADMIN_AUDIT_EVENTS_FULL = "/administration/audit-events" as const;
export const ROUTE_ID_ADMIN_AUDIT_EVENTS = "/_layout/_admin/administration/audit-events" as const;

// Nested under the `_admin` pathless layout route: the role guard runs once on the
// parent (`requireRole("administrator")`), so this route needs no guard of its own.
export const routeAdminAuditEvents = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: PATH_ADMIN_AUDIT_EVENTS,
  head: () => ({
    meta: [{ title: "Audit Events | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
