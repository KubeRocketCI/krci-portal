import { trpc } from "@/core/clients/trpc";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { QueryKey } from "@tanstack/react-query";
import { WatchEvent } from "../types";

type WatchListParams = {
  clusterName: string;
  namespace: string;
  resourceConfig: K8sResourceConfig;
  labels?: Record<string, string>;
};

type ListEventHandler<I extends KubeObjectBase> = (event: WatchEvent<I>) => void;

type ListRegistryEntry<I extends KubeObjectBase> = {
  refCount: number;
  subscription: ReturnType<typeof trpc.k8s.watchList.subscribe> | null;
  handlers: Set<ListEventHandler<I>>;
  params: WatchListParams;
  queryKey: QueryKey;
};

const keyOf = (queryKey: QueryKey) => JSON.stringify(queryKey);

class WatchListRegistry {
  private entries = new Map<string, ListRegistryEntry<KubeObjectBase>>();

  register<I extends KubeObjectBase>(
    queryKey: QueryKey,
    params: WatchListParams,
    handler: ListEventHandler<I>
  ): () => void {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id) as ListRegistryEntry<I> | undefined;

    if (existing) {
      existing.refCount += 1;
      existing.handlers.add(handler);
      return () => this.unregister(queryKey, handler);
    }

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
    if (!existing) return;

    existing.handlers.delete(handler);
    existing.refCount -= 1;

    if (existing.refCount <= 0) {
      existing.subscription?.unsubscribe();
      this.entries.delete(id);
    }
  }

  startSubscription<I extends KubeObjectBase>(queryKey: QueryKey, resourceVersion: string) {
    const id = keyOf(queryKey);
    const entry = this.entries.get(id) as ListRegistryEntry<I> | undefined;
    if (!entry || entry.subscription) return;

    const { clusterName, namespace, resourceConfig, labels } = entry.params;

    entry.subscription = trpc.k8s.watchList.subscribe(
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
          if (!event.data?.metadata?.name) return;

          // Emit event to all handlers
          entry.handlers.forEach((handler) => handler(event));
        },
        onError: (error: RequestError) => {
          console.error(`❌ WatchList WebSocket error for ${resourceConfig.pluralName}:`, {
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
}

export const watchListRegistry = new WatchListRegistry();

type WatchItemParams = {
  clusterName: string;
  namespace: string;
  resourceConfig: K8sResourceConfig;
  name: string;
};

type ItemEventHandler<I extends KubeObjectBase> = (data: I) => void;

type ItemRegistryEntry<I extends KubeObjectBase> = {
  refCount: number;
  subscription: ReturnType<typeof trpc.k8s.watchItem.subscribe> | null;
  handlers: Set<ItemEventHandler<I>>;
  params: WatchItemParams;
  queryKey: QueryKey;
};

class WatchItemRegistry {
  private entries = new Map<string, ItemRegistryEntry<KubeObjectBase>>();

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
    if (!existing) return;

    existing.handlers.delete(handler);
    existing.refCount -= 1;

    if (existing.refCount <= 0) {
      existing.subscription?.unsubscribe();
      this.entries.delete(id);
    }
  }

  startSubscription<I extends KubeObjectBase>(queryKey: QueryKey, resourceVersion: string) {
    const id = keyOf(queryKey);
    const entry = this.entries.get(id) as ItemRegistryEntry<I> | undefined;
    if (!entry || entry.subscription) return;

    const { clusterName, namespace, resourceConfig, name } = entry.params;

    entry.subscription = trpc.k8s.watchItem.subscribe(
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
          if (!data?.metadata?.uid) return;

          // Emit event to all handlers
          entry.handlers.forEach((handler) => handler(data));
        },
        onError: (error: RequestError) => {
          console.error(`❌ WatchItem WebSocket error for ${resourceConfig.pluralName}:`, {
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
}

export const watchItemRegistry = new WatchItemRegistry();
