import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./_root";
import { useClusterStore } from "@/k8s/store";

// Route path constants
export const PATH_AUTH = "auth" as const;
export const PATH_CLUSTER = "c/$clusterName" as const;
export const PATH_CICD = "cicd" as const;
export const PATH_OBSERVABILITY = "observability" as const;
export const PATH_SECURITY = "security" as const;
export const PATH_CONFIGURATION = "configuration" as const;

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH_AUTH,
});

export const contentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_layout",
});

// Index route to redirect "/" to "/home"
export const indexRoute = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({
      to: "/home",
    });
  },
});

export const routeCluster = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: PATH_CLUSTER,
  beforeLoad: ({ location, params }) => {
    const clusterName = useClusterStore.getState().clusterName || import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAME || "";

    if (params.clusterName !== clusterName) {
      // Load only known cluster
      throw redirect({
        to: "/home",
      });
    }

    if (location.pathname === `/c/${params.clusterName}` || location.pathname === `/c/${params.clusterName}/`) {
      throw redirect({
        to: "/c/$clusterName/projects",
        params: {
          clusterName: params.clusterName,
        },
      });
    }
  },
});

export const routeCICD = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CICD,
});

export const routeObservability = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_OBSERVABILITY,
});

export const routeSecurity = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_SECURITY,
});

export const routeConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CONFIGURATION,
});
