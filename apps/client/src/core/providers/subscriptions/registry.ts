import type { AppRouter } from "@my-project/trpc";
import type { TRPCClient } from "@trpc/client";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { QueryKey } from "@tanstack/react-query";
import { WatchEvent } from "@/k8s/api/hooks/useWatch/types";

type WatchListParams = {
  clusterName: string;
  namespace: string;
  resourceConfig: K8sResourceConfig;
  labels?: Record<string, string>;
};

type ListEventHandler<I extends KubeObjectBase> = (event: WatchEvent<I>) => void;

type ListRegistryEntry<I extends KubeObjectBase> = {
  refCount: number;
  subscription: ReturnType<TRPCClient<AppRouter>["k8s"]["watchList"]["subscribe"]> | null;
  handlers: Set<ListEventHandler<I>>;
  params: WatchListParams;
  queryKey: QueryKey;
};

const keyOf = (queryKey: QueryKey) => JSON.stringify(queryKey);

class WatchListRegistry {
  private entries = new Map<string, ListRegistryEntry<KubeObjectBase>>();
  private trpcClient: TRPCClient<AppRouter> | null = null;

  setTRPCClient(client: TRPCClient<AppRouter>) {
    this.trpcClient = client;
  }

  register<I extends KubeObjectBase>(
    queryKey: QueryKey,
    params: WatchListParams,
    handler: ListEventHandler<I>
  ): () => void {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id) as ListRegistryEntry<I> | undefined;

    if (existing) {
      // Reuse existing entry and subscription
      existing.refCount += 1;
      existing.handlers.add(handler);
      return () => this.unregister(queryKey, handler);
    }

    // Create new entry
    const entry: ListRegistryEntry<I> = {
      refCount: 1,
      subscription: null,
      handlers: new Set([handler]),
      params,
      queryKey,
    };

    this.entries.set(id, entry as ListRegistryEntry<KubeObjectBase>);
    return () => this.unregister(queryKey, handler);
  }

  unregister<I extends KubeObjectBase>(queryKey: QueryKey, handler: ListEventHandler<I>) {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id) as ListRegistryEntry<I> | undefined;
    if (!existing) {
      return;
    }

    existing.handlers.delete(handler);
    existing.refCount -= 1;

    // Only stop subscription and remove entry if no handlers remain
    // This prevents unnecessary subscription restarts when components re-render
    if (existing.refCount <= 0 && existing.handlers.size === 0) {
      existing.subscription?.unsubscribe();
      this.entries.delete(id);
    }
  }

  startSubscription<I extends KubeObjectBase>(queryKey: QueryKey, resourceVersion: string) {
    const id = keyOf(queryKey);
    const entry = this.entries.get(id) as ListRegistryEntry<I> | undefined;

    // If subscription already exists, reuse it (don't restart)
    if (entry?.subscription) {
      return;
    }

    if (!entry || !this.trpcClient) {
      return;
    }

    const { clusterName, namespace, resourceConfig, labels } = entry.params;

    entry.subscription = this.trpcClient.k8s.watchList.subscribe(
      {
        clusterName,
        resourceConfig,
        namespace,
        labels,
        resourceVersion,
      },
      {
        onData: (value: { type: string; data?: KubeObjectBase }) => {
          const event = value as WatchEvent<I>;
          if (!event.data?.metadata?.name) {
            return;
          }

          // Emit event to all handlers
          entry.handlers.forEach((handler) => {
            try {
              handler(event);
            } catch (error) {
              console.error(`[WatchListRegistry] Handler error`, {
                queryKey: id,
                error,
              });
            }
          });
        },
        onError: (error: RequestError) => {
          console.error(`[WatchListRegistry] WebSocket error`, {
            queryKey: id,
            resource: resourceConfig.pluralName,
            error,
            resourceVersion,
            clusterName,
            namespace,
            labels: JSON.stringify(labels),
          });
        },
      }
    );
  }

  /**
   * Cleanup all subscriptions and clear all entries.
   * Used when user logs out to ensure all WebSocket connections are closed.
   */
  cleanup() {
    for (const entry of this.entries.values()) {
      entry.subscription?.unsubscribe();
    }
    this.entries.clear();
  }
}

// Export classes for instantiation in SubscriptionsProvider
export { WatchListRegistry };

type WatchItemParams = {
  clusterName: string;
  namespace: string;
  resourceConfig: K8sResourceConfig;
  name: string;
};

type ItemEventHandler<I extends KubeObjectBase> = (data: I) => void;

type ItemRegistryEntry<I extends KubeObjectBase> = {
  refCount: number;
  subscription: ReturnType<TRPCClient<AppRouter>["k8s"]["watchItem"]["subscribe"]> | null;
  handlers: Set<ItemEventHandler<I>>;
  params: WatchItemParams;
  queryKey: QueryKey;
};

class WatchItemRegistry {
  private entries = new Map<string, ItemRegistryEntry<KubeObjectBase>>();
  private trpcClient: TRPCClient<AppRouter> | null = null;

  setTRPCClient(client: TRPCClient<AppRouter>) {
    this.trpcClient = client;
  }

  register<I extends KubeObjectBase>(
    queryKey: QueryKey,
    params: WatchItemParams,
    handler: ItemEventHandler<I>
  ): () => void {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id) as ItemRegistryEntry<I> | undefined;

    if (existing) {
      existing.refCount += 1;
      existing.handlers.add(handler);
      return () => this.unregister(queryKey, handler);
    }

    const entry: ItemRegistryEntry<I> = {
      refCount: 1,
      subscription: null,
      handlers: new Set([handler]),
      params,
      queryKey,
    };

    this.entries.set(id, entry as ItemRegistryEntry<KubeObjectBase>);
    return () => this.unregister(queryKey, handler);
  }

  unregister<I extends KubeObjectBase>(queryKey: QueryKey, handler: ItemEventHandler<I>) {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id) as ItemRegistryEntry<I> | undefined;
    if (!existing) {
      return;
    }

    existing.handlers.delete(handler);
    existing.refCount -= 1;

    // Only stop subscription and remove entry if no handlers remain
    // This prevents unnecessary subscription restarts when components re-render
    if (existing.refCount <= 0 && existing.handlers.size === 0) {
      existing.subscription?.unsubscribe();
      this.entries.delete(id);
    }
  }

  startSubscription<I extends KubeObjectBase>(queryKey: QueryKey, resourceVersion: string) {
    const id = keyOf(queryKey);
    const entry = this.entries.get(id) as ItemRegistryEntry<I> | undefined;

    // If subscription already exists, reuse it (don't restart)
    if (entry?.subscription) {
      return;
    }

    if (!entry || !this.trpcClient) {
      return;
    }

    const { clusterName, namespace, resourceConfig, name } = entry.params;

    entry.subscription = this.trpcClient.k8s.watchItem.subscribe(
      {
        resourceConfig,
        clusterName,
        namespace,
        resourceVersion,
        name,
      },
      {
        onData: (value: { data?: KubeObjectBase }) => {
          const data = value.data as I | undefined;
          if (!data?.metadata?.uid) {
            return;
          }

          // Emit event to all handlers
          entry.handlers.forEach((handler) => {
            try {
              handler(data);
            } catch (error) {
              console.error(`[WatchItemRegistry] Handler error`, {
                queryKey: id,
                error,
              });
            }
          });
        },
        onError: (error: RequestError) => {
          console.error(`[WatchItemRegistry] WebSocket error`, {
            queryKey: id,
            resource: resourceConfig.pluralName,
            error,
            resourceVersion,
            clusterName,
            namespace,
            name,
          });
        },
      }
    );
  }

  /**
   * Cleanup all subscriptions and clear all entries.
   * Used when user logs out to ensure all WebSocket connections are closed.
   */
  cleanup() {
    for (const entry of this.entries.values()) {
      entry.subscription?.unsubscribe();
    }
    this.entries.clear();
  }
}

// Export classes for instantiation in SubscriptionsProvider
export { WatchItemRegistry };
