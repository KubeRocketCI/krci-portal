import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_MARKETPLACE } from "./route";
import MarketplacePage from "./page";

const MarketplaceRoute = createLazyRoute(ROUTE_ID_MARKETPLACE)({
  component: MarketplacePage,
});

export default MarketplaceRoute;
