import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_EVENT_LISTENER_DETAILS } from "./route";
import EventListenerDetailsPage from "./page";

const EventListenerDetailsRoute = createLazyRoute(ROUTE_ID_EVENT_LISTENER_DETAILS)({
  component: EventListenerDetailsPage,
});

export default EventListenerDetailsRoute;
