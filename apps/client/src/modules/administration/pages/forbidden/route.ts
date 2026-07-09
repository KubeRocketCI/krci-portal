import { createRoute } from "@tanstack/react-router";
import { contentLayoutRoute } from "@/core/router/routes";
import { PATH_FORBIDDEN } from "@/core/router/paths";

export { PATH_FORBIDDEN };
export const ROUTE_ID_FORBIDDEN = "/_layout/forbidden" as const;

export const routeForbidden = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: PATH_FORBIDDEN,
  head: () => ({
    meta: [{ title: "Access Denied | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
