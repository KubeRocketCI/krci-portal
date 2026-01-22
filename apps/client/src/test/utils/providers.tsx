import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { TRPCContext } from "@/core/providers/trpc/context";
import { trpcHttpClient } from "@/core/providers/trpc/http-client";
import { useClusterStore } from "@/k8s/store";
import { createTestQueryClient } from "./query-client";
import { TEST_CLUSTER_NAME, TEST_NAMESPACE, TEST_ALLOWED_NAMESPACES } from "./constants";

// Context to pass content to the router's root component
const ContentContext = React.createContext<React.ReactNode>(null);

// Root component that renders content from context
const TestRoot = () => {
  const content = React.useContext(ContentContext);
  return <>{content}</>;
};

// Create router with the TestRoot component
const createTestRouter = () => {
  const rootRoute = createRootRoute({
    component: TestRoot,
  });

  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
    defaultPreload: false,
  });
};

/**
 * Options for the TestProviders component
 */
export interface TestProvidersOptions {
  /**
   * Custom wrapper component to wrap the content.
   * Useful for adding FilterProvider or other context-specific providers.
   */
  contentWrapper?: React.ComponentType<{
    children: React.ReactNode;
  }>;

  /**
   * Callback to seed the QueryClient cache with mock data.
   * Called with the queryClient instance before rendering.
   */
  seedQueryCache?: (queryClient: QueryClient) => void;

  /**
   * Whether to set up multiple namespaces in the cluster store.
   * Defaults to true.
   */
  enableMultiNamespace?: boolean;

  /**
   * Custom allowed namespaces. Defaults to TEST_ALLOWED_NAMESPACES.
   */
  allowedNamespaces?: string[];

  /**
   * Custom cluster name. Defaults to TEST_CLUSTER_NAME.
   */
  clusterName?: string;

  /**
   * Custom default namespace. Defaults to TEST_NAMESPACE.
   */
  defaultNamespace?: string;

  /**
   * Custom QueryClient instance. If not provided, a new test client will be created.
   */
  queryClient?: QueryClient;
}

/**
 * TestProviders component that wraps children with all necessary app providers:
 * - TRPCContext
 * - QueryClientProvider
 * - RouterProvider (TanStack Router)
 * - Cluster store setup
 *
 * @example
 * // Basic usage
 * render(
 *   <TestProviders>
 *     <MyComponent />
 *   </TestProviders>
 * );
 *
 * @example
 * // With custom content wrapper
 * render(
 *   <TestProviders
 *     contentWrapper={({ children }) => (
 *       <FilterProvider defaultValues={defaultFilterValues}>
 *         {children}
 *       </FilterProvider>
 *     )}
 *   >
 *     <MyComponent />
 *   </TestProviders>
 * );
 *
 * @example
 * // With query cache seeding
 * render(
 *   <TestProviders
 *     seedQueryCache={(client) => {
 *       client.setQueryData(['myKey'], myMockData);
 *     }}
 *   >
 *     <MyComponent />
 *   </TestProviders>
 * );
 */
export const TestProviders: React.FC<React.PropsWithChildren<TestProvidersOptions>> = ({
  children,
  contentWrapper: ContentWrapper,
  seedQueryCache,
  enableMultiNamespace = true,
  allowedNamespaces = TEST_ALLOWED_NAMESPACES,
  clusterName = TEST_CLUSTER_NAME,
  defaultNamespace = TEST_NAMESPACE,
  queryClient: providedQueryClient,
}) => {
  // Create router once per render
  const router = React.useMemo(() => createTestRouter(), []);

  // Create or use provided query client
  const queryClient = React.useMemo(() => {
    const client = providedQueryClient || createTestQueryClient();
    // Allow custom cache seeding
    seedQueryCache?.(client);
    return client;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up the cluster store with multiple namespaces to enable namespace filter
  React.useEffect(() => {
    if (enableMultiNamespace) {
      useClusterStore.setState({
        allowedNamespaces,
        defaultNamespace,
        clusterName,
      });
    }
  }, [enableMultiNamespace, allowedNamespaces, defaultNamespace, clusterName]);

  // Wrap content with optional content wrapper
  const content = ContentWrapper ? <ContentWrapper>{children}</ContentWrapper> : children;

  return (
    <TRPCContext.Provider value={trpcHttpClient}>
      <QueryClientProvider client={queryClient}>
        <ContentContext.Provider value={content}>
          <RouterProvider router={router} />
        </ContentContext.Provider>
      </QueryClientProvider>
    </TRPCContext.Provider>
  );
};
