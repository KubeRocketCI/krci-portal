import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_ADMIN_AUDIT_EVENTS } from "./route";
import AdminAuditEventsPage from "./page";

const AdminAuditEventsRoute = createLazyRoute(ROUTE_ID_ADMIN_AUDIT_EVENTS)({
  component: AdminAuditEventsPage,
});

export default AdminAuditEventsRoute;
