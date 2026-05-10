import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_EVENTS } from "./route";
import K8sEventsPage from "./page";

const K8sEventsRoute = createLazyRoute(ROUTE_ID_K8S_EVENTS)({
  component: K8sEventsPage,
});

export default K8sEventsRoute;
