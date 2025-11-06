import type { AppRouter } from "@my-project/trpc";
import type { TRPCClient } from "@trpc/client";
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { router } from "../router";
import { routeAuthLogin } from "../auth/pages/login/route";
import { routeAuthCallback } from "../auth/pages/callback/route";

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

/**
 * Handles authentication errors by redirecting to login page
 */
const handleAuthError = () => {
  if (isRedirecting) return;

  const currentPath = router.state.location.pathname;

  // Only redirect if not already on login/callback pages
  if (!currentPath.includes(routeAuthLogin.fullPath) && !currentPath.includes(routeAuthCallback.fullPath)) {
    isRedirecting = true;
    router.navigate({ to: routeAuthLogin.fullPath, replace: true });

    // Reset redirect flag after a delay to allow future redirects if needed
    setTimeout(() => {
      isRedirecting = false;
    }, 1000);
  }
};

const customFetch = async (url: URL | RequestInfo, options: RequestInit) => {
  const res = await fetch(url, options);

  // Check HTTP status code for 401
  if (res.status === 401) {
    handleAuthError();
  }

  // For tRPC batch requests, we need to check the response body for errors
  if (res.ok) {
    try {
      const clonedRes = res.clone();
      const data = await clonedRes.json();

      // Check if it's a tRPC batch response with errors
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.error) {
            const errorData = item.error;
            // Check for UNAUTHORIZED error code or 401 httpStatus
            if (
              errorData.code === "UNAUTHORIZED" ||
              errorData.data?.code === "UNAUTHORIZED" ||
              errorData.data?.httpStatus === 401 ||
              errorData.data?.httpStatus === 403
            ) {
              handleAuthError();
              break;
            }
          }
        }
      } else if (data.error) {
        // Single request error
        const errorData = data.error;
        if (
          errorData.code === "UNAUTHORIZED" ||
          errorData.data?.code === "UNAUTHORIZED" ||
          errorData.data?.httpStatus === 401 ||
          errorData.data?.httpStatus === 403
        ) {
          handleAuthError();
        }
      }
    } catch {
      // If parsing fails, ignore - it's not a JSON response or not an error
    }
  }

  return res;
};

export const trpc: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: wsLink({
        client: createWSClient({
          url: "/api",
        }),
      }),
      false: httpBatchLink({
        url: "/api",
        headers: { credentials: "include" },
        maxItems: 1,
        fetch: async (url, options) => {
          return customFetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    }),
  ],
});
