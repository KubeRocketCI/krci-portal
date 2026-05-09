import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_EVENT_LISTENERS } from "./route";
import EventListenerListPage from "./page";

const EventListenerListRoute = createLazyRoute(ROUTE_ID_EVENT_LISTENERS)({
  component: EventListenerListPage,
});

export default EventListenerListRoute;
