import { router } from "../../router";
import { routeAuthLogin } from "../../auth/pages/login/route";
import { routeAuthCallback } from "../../auth/pages/callback/route";
import { showToast } from "../../components/Snackbar";

export const REDIRECT_DEBOUNCE_MS = 1000;

let isRedirecting = false;

/** Sends the browser to the login page with the current path as the return target. No-op on auth pages and while a redirect is pending. */
export function handleAuthError(): void {
  if (isRedirecting) return;

  const currentPath = router.state.location.pathname;
  const isOnAuthPage =
    currentPath.includes(routeAuthLogin.fullPath) || currentPath.includes(routeAuthCallback.fullPath);

  if (isOnAuthPage) return;

  isRedirecting = true;

  showToast("Session expired. Please log in again.", "warning", {
    duration: 4000,
  });

  const params = new URLSearchParams({
    redirect: currentPath,
    reason: "session-expired",
  });
  window.location.href = `${routeAuthLogin.fullPath}?${params.toString()}`;

  setTimeout(() => {
    isRedirecting = false;
  }, REDIRECT_DEBOUNCE_MS);
}
