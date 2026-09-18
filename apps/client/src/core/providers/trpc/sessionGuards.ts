import { createAuthErrorLink } from "./authErrorLink";
import { handleAuthError } from "./handleAuthError";
import { createSessionFetch } from "./sessionFetch";

/** One link and one fetch for both tRPC clients, so their session handling cannot drift apart. */
export const authErrorLink = createAuthErrorLink({ onAuthError: handleAuthError });
export const sessionFetch = createSessionFetch({ onAuthError: handleAuthError });
