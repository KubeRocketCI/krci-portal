import { createRoute } from "@tanstack/react-router";
import LoginPage from "./view";
import { RoutePath } from "@/core/router/types";
import { authRoute } from "@/core/router";

export interface Search {
  redirect?: RoutePath | undefined;
}

export const routeAuthLogin = createRoute({
  getParentRoute: () => authRoute,
  path: "/login",
  validateSearch: (search: Record<string, string>): Search => {
    return {
      redirect: search?.redirect as RoutePath,
    };
  },
  component: LoginPage,
});
