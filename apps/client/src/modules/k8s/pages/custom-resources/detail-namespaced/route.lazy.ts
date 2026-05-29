import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_CR_DETAIL_NS } from "./route";
import CRDetailNsPage from "./page";

const K8sCRDetailNsRoute = createLazyRoute(ROUTE_ID_K8S_CR_DETAIL_NS as never)({ component: CRDetailNsPage });

export default K8sCRDetailNsRoute;
