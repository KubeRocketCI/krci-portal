import { QueryClient } from "@tanstack/react-query";

// Note: Global error handling is done in the tRPC client (trpc.ts) via customFetch

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      refetchOnWindowFocus: false, // Avoid unnecessary refetching
      retry: 0,
      refetchOnMount: false, // Avoid refetching when remounting
      refetchOnReconnect: true, // Refetch if the app regains connection
      // Note: Global error handling is done in the tRPC client (trpc.ts) via customFetch
    },
    mutations: {
      retry: 0, // Retry mutations once on failure
      // Note: Global error handling is done in the tRPC client (trpc.ts) via customFetch
    },
  },
});
