import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a mock QueryClient for testing and storybook.
 * Configured with no retries and infinite stale time for predictable test behavior.
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
};
