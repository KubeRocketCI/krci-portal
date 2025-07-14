import { trpc } from "@/core/clients/trpc";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { QueryClient, QueryKey } from "@tanstack/react-query";

type WatchItemParams = {
  clusterName: string;
  namespace: string;
  resourceConfig: K8sResourceConfig;
  name: string;
};

type RegistryEntry = {
  refCount: number;
  subscription: ReturnType<typeof trpc.k8s.watchItem.subscribe> | null;
  latestResourceVersion: string | null;
  params: WatchItemParams;
  queryKey: QueryKey;
};

const keyOf = (queryKey: QueryKey) => JSON.stringify(queryKey);

class WatchItemRegistry {
  private entries = new Map<string, RegistryEntry>();

  register<I extends KubeObjectBase>(queryKey: QueryKey, params: WatchItemParams, queryClient: QueryClient) {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id);

    if (existing) {
      existing.refCount += 1;
      if (existing.subscription) return;
      const cached = queryClient.getQueryData<I>(queryKey);
      const rvFromCache = cached?.metadata?.resourceVersion ?? null;
      if (rvFromCache) {
        existing.latestResourceVersion = rvFromCache;
        existing.subscription = this.createSubscription<I>(existing, queryClient);
      }
      return;
    }

    const cached = queryClient.getQueryData<I>(queryKey);
    const latestResourceVersion = cached?.metadata?.resourceVersion ?? null;

    const entry: RegistryEntry = {
      refCount: 1,
      subscription: null,
      latestResourceVersion,
      params,
      queryKey,
    };

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

  ensureStarted<I extends KubeObjectBase>(queryKey: QueryKey, queryClient: QueryClient) {
    const id = keyOf(queryKey);
    const existing = this.entries.get(id);
    if (!existing || existing.subscription) return;
    const cached = queryClient.getQueryData<I>(queryKey);
    const rv = cached?.metadata?.resourceVersion ?? null;
    if (!rv) return;
    existing.latestResourceVersion = rv;
    existing.subscription = this.createSubscription<I>(existing, queryClient);
  }

  private createSubscription<I extends KubeObjectBase>(entry: RegistryEntry, queryClient: QueryClient) {
    const { clusterName, namespace, resourceConfig, name } = entry.params;

    return trpc.k8s.watchItem.subscribe(
      {
        resourceConfig,
        clusterName,
        namespace,
        resourceVersion: entry.latestResourceVersion ?? "0",
        name,
      },
      {
        onData: (value: { data?: KubeObjectBase }) => {
          const messageKubeObject = value.data as I | undefined;
          if (!messageKubeObject?.metadata?.uid) return;

          // Update resource version for the registry
          if (messageKubeObject.metadata.resourceVersion) {
            entry.latestResourceVersion = messageKubeObject.metadata.resourceVersion;
          }

          queryClient.setQueryData<I>(entry.queryKey, messageKubeObject);
        },
        onError: (error: RequestError) => {
          console.error(`❌ [DEBUG] WatchItem WebSocket error for ${resourceConfig.pluralName}:`, {
            error,
            currentResourceVersion: entry.latestResourceVersion,
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
