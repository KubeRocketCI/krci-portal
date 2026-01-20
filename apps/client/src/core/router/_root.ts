import { createRootRouteWithContext, redirect } from "@tanstack/react-router";
import NotFound from "../components/NotFound";
import { RouterErrorComponent } from "./components/RouterErrorComponent";
import Root from "./components/root";
import { MyRouterContext, RoutePath } from "./types";
import { trpcHttpClient } from "../providers/trpc/http-client";

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
  beforeLoad: async ({ context, location }) => {
    const queryClient = context.queryClient;

    // Note: We can't import route instances here to avoid circular dependencies
    // Use string paths instead
    const isAuthPage = location.pathname === "/auth/login";
    const isAuthCallbackPage = location.pathname === "/auth/callback";

    // Check if auth data is already in cache
    let authData = queryClient.getQueryData(["auth.me"]);

    // If not in cache and not on auth pages, fetch it
    // Skip fetching on auth callback page to avoid interfering with the callback flow
    if (!authData && !isAuthPage && !isAuthCallbackPage) {
      try {
        // Use ensureQueryData to wait for the auth query to complete
        // This will return cached data if available, or fetch it if not
        authData = await queryClient.ensureQueryData({
          queryKey: ["auth.me"],
          queryFn: () => trpcHttpClient.auth.me.query(),
          staleTime: Infinity,
        });
      } catch (_error) {
        // If fetch fails (e.g., network error), treat as unauthenticated
        authData = null;
        console.error("Error fetching auth data:", _error);
      }
    }

    const isAuthenticated = !!authData;

    if (isAuthPage && isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }

    if (!isAuthenticated && !isAuthPage && !isAuthCallbackPage) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href as RoutePath,
        },
      });
    }
  },
});
