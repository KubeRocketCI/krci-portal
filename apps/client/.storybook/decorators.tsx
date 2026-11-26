import React from "react";
import type { Decorator } from "@storybook/react-vite";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@my-project/trpc";
import { createTRPCClient, TRPCClientError } from "@trpc/client";
import { observable, type Observer } from "@trpc/server/observable";
import { TRPCContext } from "@/core/providers/trpc/context";
import { TestProviders, createTestQueryClient } from "@/test/utils";
import { TEST_CLUSTER_NAME, TEST_NAMESPACE, TEST_ALLOWED_NAMESPACES, mockPermissions } from "@/test/utils";

// Re-export for backward compatibility
export const STORYBOOK_CLUSTER_NAME = TEST_CLUSTER_NAME;
export const STORYBOOK_NAMESPACE = TEST_NAMESPACE;
export const STORYBOOK_ALLOWED_NAMESPACES = TEST_ALLOWED_NAMESPACES;
export { mockPermissions };
export const createMockQueryClient = createTestQueryClient;

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

  /** The URL the router starts at, search and fragment included. Defaults to "/". */
  initialUrl?: string;
}

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
    initialUrl,
  } = options;

  return (Story, context) => {
    // Wrap ContentWrapper to match TestProviders API (without args)
    const WrappedContent = ContentWrapper
      ? ({ children }: { children: React.ReactNode }) => <ContentWrapper args={context.args}>{children}</ContentWrapper>
      : undefined;

    return (
      <TestProviders
        contentWrapper={WrappedContent}
        seedQueryCache={seedQueryCache}
        enableMultiNamespace={enableMultiNamespace}
        allowedNamespaces={allowedNamespaces}
        initialUrl={initialUrl}
      >
        <div className="p-4">
          <Story />
        </div>
      </TestProviders>
    );
  };
};

/** Answers every tRPC call as `onCall` does with its observer. */
const withTrpcCalls = (onCall: (observer: Observer<never, TRPCClientError<AppRouter>>) => void): Decorator => {
  const client = createTRPCClient<AppRouter>({
    links: [() => () => observable<never, TRPCClientError<AppRouter>>(onCall)],
  });

  return (Story) => (
    <TRPCContext.Provider value={client}>
      <Story />
    </TRPCContext.Provider>
  );
};

/**
 * Makes every tRPC call fail with an error that carries `message`. List it before `withAppProviders()`: the
 * decorator listed first is the innermost, and the nearest `TRPCContext` provider wins.
 */
export const withFailingTrpc = (message: string): Decorator =>
  withTrpcCalls((observer) => observer.error(TRPCClientError.from(new Error(message))));

/** Leaves every tRPC call pending. Listed before `withAppProviders()`, as `withFailingTrpc`. */
export const withPendingTrpc = (): Decorator => withTrpcCalls(() => {});

export default withAppProviders;
