import { createAuthErrorLink } from "./authErrorLink";
import { handleAuthError } from "./handleAuthError";

/** Shared by both tRPC clients so their session handling cannot drift apart. */
export const authErrorLink = createAuthErrorLink({ onAuthError: handleAuthError });

/** `fetch` with the session cookie attached. Session expiry is classified only from the tRPC error envelope, never from the HTTP status. */
export const sessionFetch: typeof fetch = (url, options) => fetch(url, { ...options, credentials: "include" });
