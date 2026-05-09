import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIGGERS } from "./route";
import TriggerListPage from "./page";

const TriggerListRoute = createLazyRoute(ROUTE_ID_TRIGGERS)({
  component: TriggerListPage,
});

export default TriggerListRoute;
