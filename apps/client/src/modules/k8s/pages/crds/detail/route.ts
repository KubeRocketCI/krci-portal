import { createRoute } from "@tanstack/react-router";
import { routeK8sMode } from "@/core/router/routes";
import { baseDetailTabSchema } from "@/modules/k8s/constants/tabs";
import { PATH_K8S_CRDS_DETAIL, PATH_K8S_CRDS_DETAIL_FULL } from "@/modules/k8s/constants/paths";

export { PATH_K8S_CRDS_DETAIL_FULL };
// Derived from the full path constant to avoid drift if the path ever changes.
export const ROUTE_ID_K8S_CRDS_DETAIL = `/_layout${PATH_K8S_CRDS_DETAIL_FULL}` as const;

export const routeK8sCRDsDetail = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_CRDS_DETAIL,
  validateSearch: (search: Record<string, unknown>) => baseDetailTabSchema.parse(search),
  head: () => ({ meta: [{ title: "CustomResourceDefinition | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
