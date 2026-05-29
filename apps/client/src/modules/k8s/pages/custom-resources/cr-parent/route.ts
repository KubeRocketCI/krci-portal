import { createRoute, Outlet } from "@tanstack/react-router";
import { routeK8sMode } from "@/core/router/routes";
import { PATH_K8S_CR } from "@/modules/k8s/constants/paths";

export const routeK8sCRParent = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_CR,
  component: Outlet,
});
