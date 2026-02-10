import { router } from "../../router";
import { routeAuthLogin } from "../../auth/pages/login/route";
import { routeAuthCallback } from "../../auth/pages/callback/route";
import { showToast } from "../../components/Snackbar";

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

interface TrpcErrorData {
  code?: string;
  data?: {
    code?: string;
    httpStatus?: number;
  };
}

interface TrpcResponseItem {
  error?: TrpcErrorData;
}

/**
 * Handles authentication errors by redirecting to login page with redirect param
 */
function handleAuthError(): void {
  if (isRedirecting) return;

  const currentPath = router.state.location.pathname;
  const isOnAuthPage =
    currentPath.includes(routeAuthLogin.fullPath) || currentPath.includes(routeAuthCallback.fullPath);

  if (isOnAuthPage) return;

  isRedirecting = true;

  // Show toast notification
  showToast("Session expired. Please log in again.", "warning", {
    duration: 4000,
  });

  // Navigate to login with current page as redirect param and reason
  // Using window.location to preserve the full path including dynamic segments
  const params = new URLSearchParams({
    redirect: currentPath,
    reason: "session-expired",
  });
  const loginUrl = `${routeAuthLogin.fullPath}?${params.toString()}`;
  window.location.href = loginUrl;

  // Reset redirect flag after a delay to allow future redirects if needed
  setTimeout(() => {
    isRedirecting = false;
  }, 1000);
}

/**
 * Checks if error data indicates an authentication error
 */
function isAuthError(errorData: TrpcErrorData): boolean {
  if (errorData.code === "UNAUTHORIZED") return true;
  if (errorData.data?.code === "UNAUTHORIZED") return true;
  if (errorData.data?.httpStatus === 401) return true;
  if (errorData.data?.httpStatus === 403) return true;
  return false;
}

/**
 * Checks if any item in a tRPC batch response contains an auth error
 */
function hasBatchAuthError(items: TrpcResponseItem[]): boolean {
  return items.some((item) => item.error && isAuthError(item.error));
}

/**
 * Parses response and checks for authentication errors in tRPC responses
 */
async function checkResponseForAuthErrors(res: Response): Promise<void> {
  const clonedRes = res.clone();
  let data: unknown;

  try {
    data = await clonedRes.json();
  } catch {
    // If parsing fails, ignore - it's not a JSON response
    return;
  }

  if (Array.isArray(data) && hasBatchAuthError(data)) {
    handleAuthError();
    return;
  }

  const singleResponse = data as TrpcResponseItem;
  if (singleResponse.error && isAuthError(singleResponse.error)) {
    handleAuthError();
  }
}

/**
 * Custom fetch function that handles authentication errors.
 * Used by both HTTP-only and WebSocket-enabled tRPC clients.
 */
export async function customFetch(url: URL | RequestInfo, options: RequestInit): Promise<Response> {
  const res = await fetch(url, options);

  if (res.status === 401) {
    handleAuthError();
  }

  if (res.ok) {
    await checkResponseForAuthErrors(res);
  }

  return res;
}
