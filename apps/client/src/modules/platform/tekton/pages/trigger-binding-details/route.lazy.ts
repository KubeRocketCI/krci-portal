import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIGGER_BINDING_DETAILS } from "./route";
import TriggerBindingDetailsPage from "./page";

const TriggerBindingDetailsRoute = createLazyRoute(ROUTE_ID_TRIGGER_BINDING_DETAILS)({
  component: TriggerBindingDetailsPage,
});
export default TriggerBindingDetailsRoute;
