import { createLazyRoute } from "@tanstack/react-router";
import MarketplacePage from "./page";

const MarketplaceRoute = createLazyRoute("/c/$clusterName/marketplace")({
  component: MarketplacePage,
});

export default MarketplaceRoute;
