import type { AppRouter } from "@my-project/trpc";
import type { TRPCClient } from "@trpc/client";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { customFetch } from "./utils";

/**
 * HTTP-only tRPC client for use in AuthProvider.
 * This client is available before TRPCProvider is mounted and doesn't require context.
 * Used by AuthProvider for login/logout operations.
 */
export const trpcHttpClient: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
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
  ],
});
