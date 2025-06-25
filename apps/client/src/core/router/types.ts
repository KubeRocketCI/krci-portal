import { QueryClient } from "@tanstack/react-query";
import { router } from ".";
import { LinkProps } from "@tanstack/react-router";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export interface MyRouterContext {
  queryClient: QueryClient;
}

export type AppRouter = typeof router;

export type RoutePath = keyof typeof router.routesByPath;
export type RouteParams = LinkProps<typeof router.routesById>;
