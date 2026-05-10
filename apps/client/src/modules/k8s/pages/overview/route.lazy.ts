import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_OVERVIEW } from "./route";
import K8sOverviewPage from "./page";

const K8sOverviewRoute = createLazyRoute(ROUTE_ID_K8S_OVERVIEW)({
  component: K8sOverviewPage,
});

export default K8sOverviewRoute;
