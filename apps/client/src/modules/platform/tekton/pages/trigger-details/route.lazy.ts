import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIGGER_DETAILS } from "./route";
import TriggerDetailsPage from "./page";

const TriggerDetailsRoute = createLazyRoute(ROUTE_ID_TRIGGER_DETAILS)({ component: TriggerDetailsPage });
export default TriggerDetailsRoute;
