import { QueryClient } from "@tanstack/react-query";
import { router } from ".";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export interface MyRouterContext {
  queryClient: QueryClient;
}

export type AppRouter = typeof router;

export type RouterPaths = keyof typeof router.routesByPath;
