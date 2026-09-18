import type { AppRouter } from "@my-project/trpc";
import type { TRPCClient } from "@trpc/client";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { authErrorLink, sessionFetch } from "./sessionGuards";

/**
 * HTTP-only tRPC client for use in AuthProvider.
 * This client is available before TRPCProvider is mounted and doesn't require context.
 * Used by AuthProvider for login/logout operations.
 */
export const trpcHttpClient: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [authErrorLink, httpBatchLink({ url: "/api", maxItems: 1, fetch: sessionFetch })],
});
