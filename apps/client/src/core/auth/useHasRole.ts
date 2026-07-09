import type { PortalRole } from "@my-project/shared";
import { useAuth } from "@/core/auth/provider";

// UX-only visibility check (hide a nav entry/section) — NOT the authorization boundary;
// the server-side `authorizedProcedure` is authoritative. Reads the server-computed
// `roles` off `auth.me`; the client never derives roles itself.
export function useHasRole(role: PortalRole): boolean {
  const { user } = useAuth();

  return user?.roles?.includes(role) ?? false;
}
