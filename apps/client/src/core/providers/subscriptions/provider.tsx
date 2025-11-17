import React, { useRef, useMemo, useContext } from "react";
import { useTRPCClient } from "@/core/providers/trpc";
import { AuthContext } from "@/core/auth/provider/context";
import { WatchListRegistry, WatchItemRegistry } from "./registry";
import { WatchRegistriesContext } from "./context";

/**
 * Provider that creates and manages watch registry instances.
 *
 * Uses class instances that persist across renders, aligning with
 * React's rendering model philosophy where class instances maintain state between renders.
 *
 * The registries are only created when the user is authenticated, ensuring that
 * WebSocket subscriptions are only established after authentication succeeds.
 * This provider must be a child of both AuthProvider and TRPCProvider.
 */
export const SubscriptionsProvider = ({ children }: React.PropsWithChildren) => {
  const { isAuthenticated } = useContext(AuthContext);
  const trpcClient = useTRPCClient();

  // Use refs to track auth state and registries to avoid unnecessary recreations
  const authRef = useRef(isAuthenticated);
  const watchListRegistryRef = useRef<WatchListRegistry | null>(null);
  const watchItemRegistryRef = useRef<WatchItemRegistry | null>(null);
  const clientRef = useRef(trpcClient);

  // Create registries with conditional initialization based on authentication
  const registries = useMemo(() => {
    // Only recreate if authentication state changed
    if (authRef.current !== isAuthenticated || !watchListRegistryRef.current || !watchItemRegistryRef.current) {
      authRef.current = isAuthenticated;

      if (isAuthenticated) {
        // Create registries when authenticated
        watchListRegistryRef.current = new WatchListRegistry();
        watchItemRegistryRef.current = new WatchItemRegistry();

        // Initialize registries with the tRPC client
        watchListRegistryRef.current.setTRPCClient(trpcClient);
        watchItemRegistryRef.current.setTRPCClient(trpcClient);
        clientRef.current = trpcClient;
      } else {
        // Cleanup subscriptions before clearing registries when not authenticated
        if (watchListRegistryRef.current) {
          watchListRegistryRef.current.cleanup();
        }
        if (watchItemRegistryRef.current) {
          watchItemRegistryRef.current.cleanup();
        }
        watchListRegistryRef.current = null;
        watchItemRegistryRef.current = null;
      }
    } else if (clientRef.current !== trpcClient && watchListRegistryRef.current && watchItemRegistryRef.current) {
      // Update client if it changed but auth state hasn't
      clientRef.current = trpcClient;
      watchListRegistryRef.current.setTRPCClient(trpcClient);
      watchItemRegistryRef.current.setTRPCClient(trpcClient);
    }

    return {
      watchListRegistry: watchListRegistryRef.current,
      watchItemRegistry: watchItemRegistryRef.current,
    };
  }, [isAuthenticated, trpcClient]);

  return <WatchRegistriesContext.Provider value={registries}>{children}</WatchRegistriesContext.Provider>;
};
