import { redirect } from "@tanstack/react-router";
import type { PortalRole } from "@my-project/shared";
import type { QueryClient } from "@tanstack/react-query";
import { PATH_FORBIDDEN_FULL } from "@/core/router/paths";

interface CachedAuthMe {
  roles?: PortalRole[];
}

// Route-guard for a `beforeLoad`: reads the cached `["auth.me"]` `roles` (the server's
// verdict, no new fetch). A denial redirects to the in-app `Forbidden` page, NEVER
// `/auth/login` — an authenticated-but-unauthorized user is not a session expiry.
export function requireRole(role: PortalRole) {
  return ({ context }: { context: { queryClient: QueryClient } }) => {
    const authData = context.queryClient.getQueryData<CachedAuthMe | null | undefined>(["auth.me"]);
    const roles = authData?.roles ?? [];

    if (!roles.includes(role)) {
      throw redirect({ to: PATH_FORBIDDEN_FULL });
    }
  };
}
