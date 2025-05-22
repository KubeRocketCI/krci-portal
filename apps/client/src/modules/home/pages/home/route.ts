import { contentLayoutRoute } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeHome = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: "home",
}).lazy(() => import("./route.lazy").then((res) => res.default));
