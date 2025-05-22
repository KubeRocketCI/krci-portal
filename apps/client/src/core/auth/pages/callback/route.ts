import { createRoute } from "@tanstack/react-router";
import AuthCallbackPage from "./view";
import { RouterPaths } from "@/core/router/types";
import { authRoute } from "@/core/router";

export interface Search {
  redirect?: RouterPaths | undefined;
  iss: string;
  session_state: string;
  state: string;
  code: string;
}

export const routeAuthCallback = createRoute({
  getParentRoute: () => authRoute,
  path: "/callback",
  validateSearch: (search: Record<string, string>): Search => {
    return {
      redirect: search?.redirect as RouterPaths,
      iss: search?.iss,
      session_state: search?.session_state,
      state: search?.state,
      code: search?.code,
    };
  },
  component: AuthCallbackPage,
});
