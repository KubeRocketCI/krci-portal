import { createRootRouteWithContext, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { LoadingProgressBar } from "../components/ui/LoadingProgressBar";
import { routeHome } from "../../modules/home/pages/home/route";
import { routeComponentList } from "../../modules/platform/codebases/pages/list/route";
import { routeAuthCallback } from "../auth/pages/callback/route";
import { routeAuthLogin } from "../auth/pages/login/route";
import NotFound from "../components/NotFound";
import ContentLayout from "../components/PageLayout";
import Root from "./components/root";
import { MyRouterContext, RouterPaths } from "./types";
import { routeComponentDetails } from "../../modules/platform/codebases/pages/details/route";

export const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
  loader: () => void 0,
  notFoundComponent: NotFound,
  beforeLoad: ({ context, location }) => {
    const queryClient = context.queryClient;

    const isAuthPage = location.pathname === routeAuthLogin.fullPath;
    const isAuthenticated = queryClient.getQueryData(["auth.me"]);
    const isAuthCallbackPage = location.pathname === routeAuthCallback.fullPath;

    if (isAuthPage && isAuthenticated) {
      throw redirect({
        to: routeHome.fullPath,
      });
    }

    if (!isAuthenticated && !isAuthPage && !isAuthCallbackPage) {
      throw redirect({
        to: routeAuthLogin.fullPath,
        search: {
          redirect: location.href as RouterPaths,
        },
      });
    }
  },
});

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "auth",
});

export const contentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ContentLayout,
});

export const routeCluster = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: "c/$clusterName",
  beforeLoad: ({ location, params, context }) => {
    const queryClient = context.queryClient;
    const clusterName = queryClient.getQueryData(["clusterName"]);

    if (params.clusterName !== clusterName) {
      // Load only known cluster
      throw redirect({
        to: routeHome.fullPath,
      });
    }

    if (location.pathname === `/c/${params.clusterName}` || location.pathname === `/c/${params.clusterName}/`) {
      throw redirect({
        to: routeComponentList.fullPath,
        params: {
          clusterName: params.clusterName,
        },
      });
    }
  },
});

const routeTree = rootRoute.addChildren([
  authRoute.addChildren([routeAuthLogin, routeAuthCallback]),
  contentLayoutRoute.addChildren([routeHome, routeCluster.addChildren([routeComponentList, routeComponentDetails])]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultStaleTime: 5000,
  scrollRestoration: true,
  defaultPendingComponent: LoadingProgressBar,
  context: {
    queryClient: undefined!,
  },
});
