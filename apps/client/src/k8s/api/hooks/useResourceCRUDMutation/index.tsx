import { useTRPCClient } from "@/core/providers/trpc";
import { showToast, ToastOptions } from "@/core/components/Snackbar";
import { useClusterStore } from "@/k8s/store";
import { K8sOperation, k8sOperation, K8sResourceConfig, KubeObjectBase, KubeObjectDraft } from "@my-project/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { getK8sWatchItemQueryCacheKey, getK8sWatchListQueryCacheKey } from "../useWatch/query-keys";
import { CustomKubeObjectList } from "../useWatch/types";

type UseResourceCRUDMutationReturnType<
  KubeObjectData,
  Operation extends K8sOperation,
> = Operation extends typeof k8sOperation.delete ? void : KubeObjectData;

// Compare two K8s resourceVersion strings as integers; missing/invalid is treated
// as -Infinity so we always prefer a defined value. Matches the watch event
// handler's effective behavior (useWatchList.onWatchEvent skips only when current
// is strictly greater), so equal versions still overwrite — a no-op when the data
// is identical and a safe convergence point when the watch event races the mutation
// response.
const isNewer = (incoming: string | undefined, current: string | undefined): boolean => {
  const a = incoming ? parseInt(incoming, 10) : NaN;
  const b = current ? parseInt(current, 10) : NaN;
  if (Number.isNaN(b)) return true;
  if (Number.isNaN(a)) return false;
  return a >= b;
};

interface Message {
  message: string;
  options?: ToastOptions;
}

type CustomMessages = {
  loading?: Message;
  error?: Message;
  success?: Message;
};

export interface UseResourceCRUDMutationOptions<KubeObjectData> {
  createCustomMessages?: (item: KubeObjectData) => CustomMessages;
  showMessages?: boolean;
  callbacks?: {
    onSuccess?: (data: UseResourceCRUDMutationReturnType<KubeObjectData, K8sOperation>) => void;
    onMutate?: (data: KubeObjectData) => void;
    onError?: (error: Error, data: KubeObjectData) => void;
  };
}

export interface MutationInput<KubeObjectData extends KubeObjectDraft> {
  resource: KubeObjectData;
  resourceConfig: K8sResourceConfig;
}

export const useResourceCRUDMutation = <KubeObjectData extends KubeObjectDraft, Operation extends K8sOperation>(
  mutationKey: string,
  operation: Operation,
  options?: UseResourceCRUDMutationOptions<KubeObjectData>
) => {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();
  const showMessages = options?.showMessages ?? true;

  const { namespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const mutationFn = async (input: MutationInput<KubeObjectData>) => {
    const { resource, resourceConfig } = input;
    const metadata = resource.metadata || {};
    const finalNamespace = metadata.namespace || namespace;

    switch (operation) {
      case k8sOperation.create:
        return await trpc.k8s.create.mutate({
          clusterName,
          resource,
          namespace: finalNamespace,
          resourceConfig,
        });

      case k8sOperation.update:
        return await trpc.k8s.update.mutate({
          clusterName,
          namespace: finalNamespace,
          name: resource.metadata.name,
          resource,
          resourceConfig,
        });

      case k8sOperation.delete:
        return await trpc.k8s.delete.mutate({
          clusterName,
          namespace: finalNamespace,
          name: resource.metadata.name,
          resourceConfig,
        });
    }
  };

  return useMutation({
    mutationKey: [mutationKey],
    mutationFn: async (input: MutationInput<KubeObjectData>) => {
      const { resource } = input;

      if (!showMessages) {
        return mutationFn(input);
      }

      const customMessages = options?.createCustomMessages?.(resource);
      const defaultMsg = `${resource.kind} ${resource.metadata.name}`;

      // Get messages for toast.promise
      const loadingMessage: string = (() => {
        if (customMessages?.loading) return customMessages.loading.message;
        switch (operation) {
          case k8sOperation.create:
            return `Applying ${defaultMsg}`;
          case k8sOperation.update:
            return `Updating ${defaultMsg}`;
          case k8sOperation.delete:
            return `Deleting ${defaultMsg}`;
          default:
            return `Processing ${defaultMsg}`;
        }
      })();

      const successMessage: string = (() => {
        if (customMessages?.success) return customMessages.success.message;
        switch (operation) {
          case k8sOperation.create:
            return `${defaultMsg} has been successfully applied`;
          case k8sOperation.update:
            return `${defaultMsg} has been successfully updated`;
          case k8sOperation.delete:
            return `${defaultMsg} has been successfully deleted`;
          default:
            return `${defaultMsg} operation completed successfully`;
        }
      })();

      const errorMessage: string = (() => {
        if (customMessages?.error) return customMessages.error.message;
        switch (operation) {
          case k8sOperation.create:
            return `Failed to apply ${defaultMsg}`;
          case k8sOperation.update:
            return `Failed to update ${defaultMsg}`;
          case k8sOperation.delete:
            return `Failed to delete ${defaultMsg}`;
          default:
            return `Operation failed for ${defaultMsg}`;
        }
      })();

      // Manual promise handling with custom toasts for full control
      const promise = mutationFn(input);

      // Show loading toast
      const loadingToastId = showToast(loadingMessage, "loading");

      promise
        .then(() => {
          // Update to success toast with optional link
          showToast(successMessage, "success", {
            id: loadingToastId,
            duration: customMessages?.success?.options?.duration || 5000,
            route: customMessages?.success?.options?.route,
            externalLink: customMessages?.success?.options?.externalLink,
          });
        })
        .catch((err) => {
          // Extract error message for description
          const errorDescription = err?.message || String(err);

          // Update to error toast with description
          showToast(errorMessage, "error", {
            id: loadingToastId,
            duration: 10000, // Longer duration for errors with details
            description: errorDescription,
          });
          console.error(err);
        });

      return promise;
    },
    onMutate: ({ resource }) => {
      options?.callbacks?.onMutate?.(resource);
    },
    onSuccess: (data, { resource, resourceConfig }) => {
      // Patch the watch caches with the server's response. Consumers otherwise
      // depend solely on the K8s WebSocket event, which can be delayed or
      // missed (watch restart, 410 Gone, tab throttling, watch unsubscribed
      // during navigation) — leaving stale data until a full page refresh.
      const ns = resourceConfig.clusterScoped ? undefined : (resource.metadata.namespace ?? namespace);
      // For generateName flows, the draft has no name; the API server assigns one
      // and returns it in the response. Prefer the response name when available.
      const responseName = (data as KubeObjectBase | undefined)?.metadata?.name;
      const name = responseName ?? resource.metadata.name;
      const itemQueryKey = getK8sWatchItemQueryCacheKey(clusterName, ns, resourceConfig.pluralName, name);
      const listQueryPrefix = getK8sWatchListQueryCacheKey(clusterName, ns, resourceConfig.pluralName);

      // CREATE and UPDATE both write the item cache when a fresh resource is returned.
      if ((operation === k8sOperation.create || operation === k8sOperation.update) && data) {
        const fresh = data as KubeObjectBase;
        queryClient.setQueryData<KubeObjectBase>(itemQueryKey, (prev) =>
          isNewer(fresh.metadata.resourceVersion, prev?.metadata.resourceVersion) ? fresh : prev
        );
      }

      // UPDATE: patch every list cache that already holds this item so consumers
      // see fresh data without waiting for the watch event.
      if (operation === k8sOperation.update && data && name) {
        const fresh = data as KubeObjectBase;
        const freshRV = fresh.metadata.resourceVersion;
        const matches = queryClient.getQueriesData<CustomKubeObjectList<KubeObjectBase>>({ queryKey: listQueryPrefix });
        for (const [key, prev] of matches) {
          if (!prev) continue;
          const existing = prev.items.get(name);
          if (!existing || !isNewer(freshRV, existing.metadata.resourceVersion)) continue;
          const newItems = new Map(prev.items);
          newItems.set(name, fresh);
          queryClient.setQueryData<CustomKubeObjectList<KubeObjectBase>>(key, {
            ...prev,
            metadata: {
              ...prev.metadata,
              resourceVersion: isNewer(freshRV, prev.metadata.resourceVersion)
                ? (freshRV ?? prev.metadata.resourceVersion)
                : prev.metadata.resourceVersion,
            },
            items: newItems,
          });
        }
      }

      // DELETE: clear the item cache and prune from every list cache that holds it.
      if (operation === k8sOperation.delete && name) {
        queryClient.removeQueries({ queryKey: itemQueryKey });
        const matches = queryClient.getQueriesData<CustomKubeObjectList<KubeObjectBase>>({ queryKey: listQueryPrefix });
        for (const [key, prev] of matches) {
          if (!prev?.items.has(name)) continue;
          const newItems = new Map(prev.items);
          newItems.delete(name);
          queryClient.setQueryData<CustomKubeObjectList<KubeObjectBase>>(key, { ...prev, items: newItems });
        }
      }

      // CREATE: invalidate every list cache for the resource type. Label selectors
      // aren't known at mutation time, so we can't surgically insert the new item;
      // we mark all variants stale and force a refetch (refetchType "all" because
      // list queries set refetchOnMount: false, so a remount alone wouldn't refresh).
      if (operation === k8sOperation.create) {
        queryClient.invalidateQueries({ queryKey: listQueryPrefix, refetchType: "all" });
      }

      options?.callbacks?.onSuccess?.(resource);
    },
    onError: (error, { resource }) => {
      options?.callbacks?.onError?.(error, resource);
    },
  });
};
