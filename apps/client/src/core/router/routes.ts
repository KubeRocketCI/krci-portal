import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./_root";
import { useClusterStore } from "@/k8s/store";

// Route path constants
export const PATH_AUTH = "auth" as const;
export const PATH_CLUSTER = "c/$clusterName" as const;
export const PATH_CICD = "cicd" as const;
export const PATH_OBSERVABILITY = "observability" as const;
export const PATH_CONFIGURATION = "configuration" as const;

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH_AUTH,
});

export const contentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: ({ location }) => {
    console.log("🔍 Content layout route beforeLoad debug:", {
      pathname: location.pathname,
      isRootPath: location.pathname === "/",
      timestamp: new Date().toISOString(),
    });

    if (location.pathname === "/") {
      console.log("🔄 Redirecting from root to home");
      throw redirect({
        to: "/home",
      });
    }

    console.log("✅ Content layout route beforeLoad passed - no redirect needed");
  },
});

export const routeCluster = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: PATH_CLUSTER,
  beforeLoad: ({ location, params }) => {
    const clusterName = useClusterStore.getState().clusterName || import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAME || "";

    console.log("🔍 Cluster route beforeLoad debug:", {
      pathname: location.pathname,
      paramsClusterName: params.clusterName,
      storeClusterName: clusterName,
      envDefaultCluster: import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAME,
      clusterMatch: params.clusterName === clusterName,
      timestamp: new Date().toISOString(),
    });

    if (params.clusterName !== clusterName) {
      // Load only known cluster
      console.log("🔄 Redirecting to home (cluster name mismatch)", {
        expected: clusterName,
        actual: params.clusterName,
      });
      throw redirect({
        to: "/home",
      });
    }

    if (location.pathname === `/c/${params.clusterName}` || location.pathname === `/c/${params.clusterName}/`) {
      console.log("🔄 Redirecting to components (cluster root path)");
      throw redirect({
        to: "/c/$clusterName/components",
        params: {
          clusterName: params.clusterName,
        },
      });
    }

    console.log("✅ Cluster route beforeLoad passed - no redirect needed");
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

export const routeConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CONFIGURATION,
});
