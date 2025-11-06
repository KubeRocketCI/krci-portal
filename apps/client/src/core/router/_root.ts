import { createRootRouteWithContext, redirect } from "@tanstack/react-router";
import NotFound from "../components/NotFound";
import { RouterErrorComponent } from "./components/RouterErrorComponent";
import Root from "./components/root";
import { MyRouterContext, RoutePath } from "./types";

export const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
  loader: () => void 0,
  notFoundComponent: NotFound,
  errorComponent: RouterErrorComponent,
  head: () => ({
    meta: [
      {
        name: "description",
        content: "KRCI Portal - Your comprehensive platform for managing CI/CD pipelines, components, and deployments",
      },
      {
        title: "KRCI Portal",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/krci-logo.svg",
      },
    ],
  }),
  beforeLoad: ({ context, location }) => {
    const queryClient = context.queryClient;

    // Note: We can't import route instances here to avoid circular dependencies
    // Use string paths instead
    const isAuthPage = location.pathname === "/auth/login";
    const isAuthenticated = queryClient.getQueryData(["auth.me"]);
    const isAuthCallbackPage = location.pathname === "/auth/callback";

    console.log("🔍 Root route beforeLoad debug:", {
      pathname: location.pathname,
      isAuthPage,
      isAuthCallbackPage,
      isAuthenticated,
      authData: queryClient.getQueryData(["auth.me"]),
      timestamp: new Date().toISOString(),
    });

    if (isAuthPage && isAuthenticated) {
      console.log("🔄 Redirecting from auth page to home (already authenticated)");
      throw redirect({
        to: "/",
      });
    }

    if (!isAuthenticated && !isAuthPage && !isAuthCallbackPage) {
      console.log("🔄 Redirecting to login (not authenticated)", {
        redirectUrl: location.href,
      });
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href as RoutePath,
        },
      });
    }

    console.log("✅ Root route beforeLoad passed - no redirect needed");
  },
});
