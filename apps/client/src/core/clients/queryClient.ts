import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      refetchOnWindowFocus: false, // Avoid unnecessary refetching
      retry: 1, // Retry failed requests once
      refetchOnMount: false, // Avoid refetching when remounting
      refetchOnReconnect: true, // Refetch if the app regains connection
    
    },
    mutations: {
      retry: 0, // Retry mutations once on failure
    },
  },
});
