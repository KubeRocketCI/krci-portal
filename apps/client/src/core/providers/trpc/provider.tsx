import React, { useMemo, useRef } from "react";
import type { AppRouter } from "@my-project/trpc";
import type { TRPCClient } from "@trpc/client";
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { AuthContext } from "../../auth/provider/context";
import { TRPCContext } from "./context";
import { trpcHttpClient } from "./http-client";
import { customFetch } from "./utils";

/**
 * Provider that creates a tRPC client with WebSocket support when authenticated.
 * The client is automatically upgraded to include WebSocket when authentication succeeds.
 * This provider must be a child of AuthProvider to access authentication state.
 */
export const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);

  // Use refs to track auth state and client to avoid unnecessary recreations
  const authRef = useRef(isAuthenticated);
  const clientRef = useRef<TRPCClient<AppRouter> | null>(null);

  // Create client with conditional WebSocket link based on authentication
  const client = useMemo(() => {
    // Only recreate if authentication state changed
    if (authRef.current !== isAuthenticated || !clientRef.current) {
      authRef.current = isAuthenticated;

      if (isAuthenticated) {
        // Create client with WebSocket support for subscriptions
        clientRef.current = createTRPCClient<AppRouter>({
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
      } else {
        // Use HTTP-only client when not authenticated
        clientRef.current = trpcHttpClient;
      }
    }

    return clientRef.current;
  }, [isAuthenticated]);

  return <TRPCContext.Provider value={client}>{children}</TRPCContext.Provider>;
};
