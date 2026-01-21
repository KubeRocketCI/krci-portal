import React from "react";
import type { Decorator } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { TRPCContext } from "@/core/providers/trpc/context";
import { trpcHttpClient } from "@/core/providers/trpc/http-client";
import { useClusterStore } from "@/k8s/store";

// Default cluster values for storybook
export const STORYBOOK_CLUSTER_NAME = "in-cluster";
export const STORYBOOK_NAMESPACE = "default";
export const STORYBOOK_ALLOWED_NAMESPACES = ["default", "development", "staging", "production"];

// Mock permissions data with all actions allowed
export const mockPermissions = {
  create: { allowed: true, reason: "" },
  patch: { allowed: true, reason: "" },
  delete: { allowed: true, reason: "" },
};

// Create a mock query client for stories
export const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });
};

// Context to pass story content to the router's root component
const StoryContentContext = React.createContext<React.ReactNode>(null);

// Root component that renders content from context
const StoryRoot = () => {
  const content = React.useContext(StoryContentContext);
  return <>{content}</>;
};

// Create router with the StoryRoot component
const createStoryRouter = () => {
  const rootRoute = createRootRoute({
    component: StoryRoot,
  });

  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
    defaultPreload: false,
  });
};

/**
 * Options for the withAppProviders decorator
 */
export interface WithAppProvidersOptions {
  /**
   * Custom wrapper component to wrap the story content.
   * Receives children and context.args as props.
   * Useful for adding FilterProvider or other context-specific providers.
   */
  contentWrapper?: React.ComponentType<{
    children: React.ReactNode;
    args: Record<string, unknown>;
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
   * Custom allowed namespaces. Defaults to STORYBOOK_ALLOWED_NAMESPACES.
   */
  allowedNamespaces?: string[];
}

/**
 * Props for the StoryWrapper component
 */
interface StoryWrapperProps {
  Story: React.ComponentType;
  args: Record<string, unknown>;
  ContentWrapper?: React.ComponentType<{
    children: React.ReactNode;
    args: Record<string, unknown>;
  }>;
  seedQueryCache?: (queryClient: QueryClient) => void;
  enableMultiNamespace: boolean;
  allowedNamespaces: string[];
}

/**
 * Internal wrapper component that properly uses React hooks
 */
const StoryWrapper = ({
  Story,
  args,
  ContentWrapper,
  seedQueryCache,
  enableMultiNamespace,
  allowedNamespaces,
}: StoryWrapperProps) => {
  // Create router and query client once per render
  const router = React.useMemo(() => createStoryRouter(), []);
  const queryClient = React.useMemo(() => {
    const client = createMockQueryClient();
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
        defaultNamespace: STORYBOOK_NAMESPACE,
        clusterName: STORYBOOK_CLUSTER_NAME,
      });
    }
  }, [enableMultiNamespace, allowedNamespaces]);

  // Wrap story content with optional content wrapper
  const storyContent = ContentWrapper ? (
    <ContentWrapper args={args}>
      <div className="p-4">
        <Story />
      </div>
    </ContentWrapper>
  ) : (
    <div className="p-4">
      <Story />
    </div>
  );

  return (
    <TRPCContext.Provider value={trpcHttpClient}>
      <QueryClientProvider client={queryClient}>
        <StoryContentContext.Provider value={storyContent}>
          <RouterProvider router={router} />
        </StoryContentContext.Provider>
      </QueryClientProvider>
    </TRPCContext.Provider>
  );
};

/**
 * Creates a decorator that wraps stories with all necessary app providers:
 * - TRPCContext
 * - QueryClientProvider
 * - RouterProvider (TanStack Router)
 * - Cluster store setup (for namespace filter)
 *
 * @param options - Configuration options for the decorator
 * @returns A Storybook decorator function
 *
 * @example
 * // Basic usage
 * decorators: [withAppProviders()]
 *
 * @example
 * // With custom content wrapper (e.g., FilterProvider)
 * decorators: [withAppProviders({
 *   contentWrapper: ({ children, args }) => (
 *     <FilterProvider defaultValues={args.defaultFilterValues}>
 *       {children}
 *     </FilterProvider>
 *   ),
 * })]
 *
 * @example
 * // With query cache seeding
 * decorators: [withAppProviders({
 *   seedQueryCache: (client) => {
 *     client.setQueryData(['myKey'], myMockData);
 *   },
 * })]
 */
export const withAppProviders = (options: WithAppProvidersOptions = {}): Decorator => {
  const {
    contentWrapper: ContentWrapper,
    seedQueryCache,
    enableMultiNamespace = true,
    allowedNamespaces = STORYBOOK_ALLOWED_NAMESPACES,
  } = options;

  return (Story, context) => (
    <StoryWrapper
      Story={Story}
      args={context.args}
      ContentWrapper={ContentWrapper}
      seedQueryCache={seedQueryCache}
      enableMultiNamespace={enableMultiNamespace}
      allowedNamespaces={allowedNamespaces}
    />
  );
};

export default withAppProviders;
