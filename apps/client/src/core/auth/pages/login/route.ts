import { createRoute } from "@tanstack/react-router";
import LoginPage from "./view";
import { RoutePath } from "@/core/router/types";
import { authRoute } from "@/core/router/routes";

export const PATH_AUTH_LOGIN = "/login" as const;

export interface Search {
  redirect?: RoutePath | undefined;
}

export const routeAuthLogin = createRoute({
  getParentRoute: () => authRoute,
  path: PATH_AUTH_LOGIN,
  validateSearch: (search: Record<string, string>): Search => {
    return {
      redirect: search?.redirect as RoutePath,
    };
  },
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign In | KRCI" }],
  }),
});
