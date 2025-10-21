import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./_root";

// Route path constants
export const PATH_AUTH = "auth" as const;
export const PATH_CLUSTER = "c/$clusterName" as const;
export const PATH_CICD = "cicd" as const;
export const PATH_CONFIGURATION = "configuration" as const;

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH_AUTH,
});

export const contentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: ({ location }) => {
    if (location.pathname === "/") {
      throw redirect({
        to: "/home",
      });
    }
  },
});

export const routeCluster = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: PATH_CLUSTER,
  beforeLoad: ({ location, params, context }) => {
    const queryClient = context.queryClient;
    const clusterName =
      queryClient.getQueryData<string>(["clusterName"]) || import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAME || "";

    if (params.clusterName !== clusterName) {
      // Load only known cluster

      throw redirect({
        to: "/home",
      });
    }

    if (location.pathname === `/c/${params.clusterName}` || location.pathname === `/c/${params.clusterName}/`) {
      throw redirect({
        to: "/c/$clusterName/components",
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

export const routeConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CONFIGURATION,
});
