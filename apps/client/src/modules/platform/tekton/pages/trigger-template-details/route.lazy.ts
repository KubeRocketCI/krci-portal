import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIGGER_TEMPLATE_DETAILS } from "./route";
import TriggerTemplateDetailsPage from "./page";

const TriggerTemplateDetailsRoute = createLazyRoute(ROUTE_ID_TRIGGER_TEMPLATE_DETAILS)({
  component: TriggerTemplateDetailsPage,
});
export default TriggerTemplateDetailsRoute;
