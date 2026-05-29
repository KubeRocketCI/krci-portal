import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_CR_LIST } from "./route";
import CRListPage from "./page";

const K8sCRListRoute = createLazyRoute(ROUTE_ID_K8S_CR_LIST)({ component: CRListPage });

export default K8sCRListRoute;
