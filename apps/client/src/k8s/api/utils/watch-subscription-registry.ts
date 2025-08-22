import { trpc } from "@/core/clients/trpc";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { QueryClient, QueryKey } from "@tanstack/react-query";
import { CustomKubeObjectList, MSG_TYPE } from "../hooks/watch-types";

type WatchListParams = {
  clusterName: string;
  namespace: string;
  resourceConfig: K8sResourceConfig;
  labels?: Record<string, string>;
};

type RegistryEntry = {
  refCount: number;
  subscription: ReturnType<typeof trpc.k8s.watchList.subscribe> | null;
  latestResourceVersion: string | null;
  params: WatchListParams;
  queryKey: QueryKey;
};

const keyOf = (queryKey: QueryKey) => JSON.stringify(queryKey);

class WatchListRegistry {
  private entries = new Map<string, RegistryEntry>();

  register<I extends KubeObjectBase>(queryKey: QueryKey, params: WatchListParams, queryClient: QueryClient) {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id);

    if (existing) {
      existing.refCount += 1;
      // If subscription exists, nothing else to do.
      if (existing.subscription) return;
      // Try to start subscription if we have a resourceVersion available from cache
      const cached = queryClient.getQueryData<CustomKubeObjectList<I>>(queryKey);
      const rvFromCache = cached?.metadata?.resourceVersion ?? null;
      if (rvFromCache) {
        existing.latestResourceVersion = rvFromCache;
        existing.subscription = this.createSubscription<I>(existing, queryClient);
      }
      return;
    }

    // New entry
    const cached = queryClient.getQueryData<CustomKubeObjectList<I>>(queryKey);
    const latestResourceVersion = cached?.metadata?.resourceVersion ?? null;

    const entry: RegistryEntry = {
      refCount: 1,
      subscription: null,
      latestResourceVersion,
      params,
      queryKey,
    };

    // Start subscription only if we have a resourceVersion
    if (entry.latestResourceVersion) {
      entry.subscription = this.createSubscription<I>(entry, queryClient);
    }

    this.entries.set(id, entry);
  }

  unregister(queryKey: QueryKey) {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id);
    if (!existing) return;

    existing.refCount -= 1;
    if (existing.refCount <= 0) {
      existing.subscription?.unsubscribe();
      this.entries.delete(id);
    }
  }

  // If initial query completes later and resourceVersion becomes available, allow hooks to nudge the registry
  // to ensure subscription is started.
  ensureStarted<I extends KubeObjectBase>(queryKey: QueryKey, queryClient: QueryClient) {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id);
    if (!existing || existing.subscription) return;
    const cached = queryClient.getQueryData<CustomKubeObjectList<I>>(queryKey);
    const rv = cached?.metadata?.resourceVersion ?? null;
    if (!rv) return;
    existing.latestResourceVersion = rv;
    existing.subscription = this.createSubscription<I>(existing, queryClient);
  }

  private createSubscription<I extends KubeObjectBase>(entry: RegistryEntry, queryClient: QueryClient) {
    const { clusterName, namespace, resourceConfig, labels } = entry.params;

    return trpc.k8s.watchList.subscribe(
      {
        clusterName,
        resourceConfig,
        namespace,
        labels,
        resourceVersion: entry.latestResourceVersion ?? "0",
      },
      {
        onData: (value: { type: string; data?: KubeObjectBase }) => {
          const event = value as { type: string; data: I };
          const messageKubeObject = event.data;
          if (!messageKubeObject?.metadata?.name) return;

          queryClient.setQueryData<CustomKubeObjectList<I>>(entry.queryKey, (prevData) => {
            if (!prevData) return prevData as unknown as CustomKubeObjectList<I>;

            const newItems = new Map(prevData.items);
            const name = messageKubeObject.metadata.name!;

            switch (value.type) {
              case MSG_TYPE.ADDED:
                newItems.set(name, messageKubeObject);
                break;
              case MSG_TYPE.MODIFIED: {
                const existing = newItems.get(name);
                if (existing && existing.metadata?.resourceVersion) {
                  const currentVersion = parseInt(existing.metadata.resourceVersion, 10);
                  const newVersion = parseInt(messageKubeObject.metadata.resourceVersion ?? "0", 10);
                  if (currentVersion < newVersion) {
                    newItems.set(name, messageKubeObject);
                  }
                } else {
                  newItems.set(name, messageKubeObject);
                }
                break;
              }
              case MSG_TYPE.DELETED:
                newItems.delete(name);
                break;
              case MSG_TYPE.ERROR:
                console.error("Error in update:", value);
                break;
              default: {
                const unknownType = (value as { type: string }).type;
                console.error("Unknown update type:", unknownType);
              }
            }

            // Update resource version for the registry and cache metadata
            if (messageKubeObject.metadata.resourceVersion) {
              entry.latestResourceVersion = messageKubeObject.metadata.resourceVersion;
            }

            return {
              ...prevData,
              metadata: {
                ...prevData.metadata,
                // reflect latest resourceVersion in cache metadata so consumers can read it
                resourceVersion: entry.latestResourceVersion ?? prevData.metadata.resourceVersion,
              } as CustomKubeObjectList<I>["metadata"],
              items: newItems,
            } as CustomKubeObjectList<I>;
          });
        },
        onError: (error: RequestError) => {
          console.error(`❌ [DEBUG] WatchList WebSocket error for ${resourceConfig.pluralName}:`, {
            error,
            currentResourceVersion: entry.latestResourceVersion,
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
