import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_CRDS_DETAIL } from "./route";
import CRDDetailPage from "./page";

const K8sCRDsDetailRoute = createLazyRoute(ROUTE_ID_K8S_CRDS_DETAIL)({
  component: CRDDetailPage,
});

export default K8sCRDsDetailRoute;
