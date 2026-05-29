import { createRoute } from "@tanstack/react-router";
import { routeK8sCRParent } from "../cr-parent/route";
import { baseDetailTabSchema } from "@/modules/k8s/constants/tabs";
import { PATH_K8S_CR_DETAIL_CLUSTER, PATH_K8S_CR_DETAIL_CLUSTER_FULL } from "@/modules/k8s/constants/paths";

// Derived from the full path constant to avoid drift if the path ever changes.
export const ROUTE_ID_K8S_CR_DETAIL_CLUSTER = `/_layout${PATH_K8S_CR_DETAIL_CLUSTER_FULL}` as const;

export const routeK8sCRDetailCluster = createRoute({
  getParentRoute: () => routeK8sCRParent,
  path: PATH_K8S_CR_DETAIL_CLUSTER,
  validateSearch: (search: Record<string, unknown>) => baseDetailTabSchema.parse(search),
  head: () => ({ meta: [{ title: "Custom Resource | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
