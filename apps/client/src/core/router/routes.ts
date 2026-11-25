import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./_root";
import { useClusterStore } from "@/k8s/store";
import { requireRole } from "@/core/auth/requireRole";
import type { ModeSegment } from "@/core/components/sidebar/ModeSwitcher/mode";

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

// Pathless layout route: one guard gates the whole Administration section; nested
// admin pages inherit it (parent-first: auth → role).
export const adminLayoutRoute = createRoute({
  getParentRoute: () => contentLayoutRoute,
  id: "_admin",
  beforeLoad: requireRole("administrator"),
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

    // Only redirect when the cluster name is known (store populated after config loads).
    // An empty clusterName means ConfigProvider hasn't finished yet — allow the route through.
    if (clusterName && params.clusterName !== clusterName) {
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

export const PATH_FACTORY = "factory" as const;
export const PATH_K8S = "k8s" as const;

function redirectBareModeToOverview(mode: ModeSegment) {
  return ({ location, params }: { location: { pathname: string }; params: { clusterName: string } }) => {
    const bare = `/c/${params.clusterName}/${mode}`;
    if (location.pathname === bare || location.pathname === `${bare}/`) {
      throw redirect({
        to: `/c/$clusterName/${mode}/overview`,
        params: { clusterName: params.clusterName },
      });
    }
  };
}

export const routeFactoryMode = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_FACTORY,
  beforeLoad: redirectBareModeToOverview(PATH_FACTORY),
});

export const routeK8sMode = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_K8S,
  beforeLoad: redirectBareModeToOverview(PATH_K8S),
});
