import { createLazyRoute } from "@tanstack/react-router";
import OverviewDetailsPage from "./page";

const OverviewDetailsRoute = createLazyRoute("/c/$clusterName/overview/$namespace")({
  component: OverviewDetailsPage,
});

export default OverviewDetailsRoute;
