import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIGGER_TEMPLATES } from "./route";
import TriggerTemplateListPage from "./page";

const TriggerTemplateListRoute = createLazyRoute(ROUTE_ID_TRIGGER_TEMPLATES)({
  component: TriggerTemplateListPage,
});

export default TriggerTemplateListRoute;
