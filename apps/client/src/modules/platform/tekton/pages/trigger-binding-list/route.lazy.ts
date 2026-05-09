import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIGGER_BINDINGS } from "./route";
import TriggerBindingListPage from "./page";

const TriggerBindingListRoute = createLazyRoute(ROUTE_ID_TRIGGER_BINDINGS)({
  component: TriggerBindingListPage,
});

export default TriggerBindingListRoute;
