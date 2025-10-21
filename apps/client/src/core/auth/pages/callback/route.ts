import { createRoute } from "@tanstack/react-router";
import AuthCallbackPage from "./view";
import { RoutePath } from "@/core/router/types";
import { authRoute } from "@/core/router/routes";

export const PATH_AUTH_CALLBACK = "/callback" as const;

export interface Search {
  redirect?: RoutePath | undefined;
  iss: string;
  session_state: string;
  state: string;
  code: string;
}

export const routeAuthCallback = createRoute({
  getParentRoute: () => authRoute,
  path: PATH_AUTH_CALLBACK,
  validateSearch: (search: Record<string, string>): Search => {
    return {
      redirect: search?.redirect as RoutePath,
      iss: search?.iss,
      session_state: search?.session_state,
      state: search?.state,
      code: search?.code,
    };
  },
  component: AuthCallbackPage,
  head: () => ({
    meta: [{ title: "Continue Sign In | KRCI" }],
  }),
});
