import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_FORBIDDEN } from "./route";
import Forbidden from "@/core/components/Forbidden";

const ForbiddenRoute = createLazyRoute(ROUTE_ID_FORBIDDEN)({
  component: Forbidden,
});

export default ForbiddenRoute;
