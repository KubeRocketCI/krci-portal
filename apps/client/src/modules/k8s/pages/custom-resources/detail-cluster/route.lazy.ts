import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_CR_DETAIL_CLUSTER } from "./route";
import CRDetailClusterPage from "./page";

const K8sCRDetailClusterRoute = createLazyRoute(ROUTE_ID_K8S_CR_DETAIL_CLUSTER)({ component: CRDetailClusterPage });

export default K8sCRDetailClusterRoute;
