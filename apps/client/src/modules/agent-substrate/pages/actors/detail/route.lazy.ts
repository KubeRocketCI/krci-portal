import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_FACTORY_ACTOR_DETAIL } from "./route";
import FactoryActorDetailPage from "./page";

const FactoryActorDetailRoute = createLazyRoute(ROUTE_ID_FACTORY_ACTOR_DETAIL)({
  component: FactoryActorDetailPage,
});

export default FactoryActorDetailRoute;
