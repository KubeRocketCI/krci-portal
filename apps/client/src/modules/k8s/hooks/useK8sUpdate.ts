import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { getK8sWatchItemQueryCacheKey, getK8sWatchListQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";
import type { K8sResourceConfig } from "@my-project/shared";
import { useK8sActionMutation } from "./useK8sActionMutation";

interface UpdateInput {
  namespace: string;
  name: string;
  body: unknown;
}

export function useK8sUpdate(config: K8sResourceConfig) {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((s) => s.clusterName);

  return useK8sActionMutation<UpdateInput, unknown>({
    mutationKey: `update:${config.kind}`,
    mutationFn: ({ namespace, name, body }) =>
      trpc.k8s.update.mutate({
        clusterName,
        namespace,
        name,
        resourceConfig: config,
        resource: body,
      }),
    messages: {
      loading: ({ name }) => `Updating ${config.kind} ${name}…`,
      success: ({ name }) => `${config.kind} ${name} updated`,
      error: ({ name }, err) => {
        const e = err as { data?: { code?: string }; message?: string };
        const isConflict =
          e?.data?.code === "CONFLICT" || (typeof e?.message === "string" && e.message.includes("409"));
        return isConflict
          ? `${config.kind} ${name} changed since you opened it — reload and re-apply`
          : `Failed to update ${config.kind} ${name}`;
      },
    },
    invalidationKeys: ({ namespace, name }) => {
      // Cluster-scoped resources have no namespace. Pass undefined so the cache key
      // matches the CLUSTER_SCOPE_KEY sentinel used by useWatchList/useWatchItem,
      // which also receive undefined for cluster-scoped resources.
      //
      // For namespaced resources, pass the namespace as-is. Do NOT coerce empty string
      // to undefined: getK8sWatchListQueryCacheKey treats undefined as the __cluster__
      // sentinel, which would never match the actual watchList key (keyed on the real
      // namespace string). If namespace is somehow empty for a namespaced resource that
      // is a precondition violation — log a dev warning rather than silently mis-keying.
      let nsKey: string | undefined;
      if (config.clusterScoped) {
        nsKey = undefined;
      } else {
        if (process.env.NODE_ENV !== "production" && !namespace) {
          console.warn(
            `[useK8sUpdate] ${config.kind} "${name}" has no namespace but config is not clusterScoped — invalidation key may not match the active watch query.`
          );
        }
        // Pass namespace directly so the invalidation key matches what useWatchList
        // produced. Do NOT coerce empty string to undefined: that would encode as
        // __cluster__ and miss the real namespaced watch query entirely.
        nsKey = namespace;
      }
      return [
        getK8sWatchListQueryCacheKey(clusterName, nsKey, config.group, config.pluralName),
        getK8sWatchItemQueryCacheKey(clusterName, nsKey, config.group, config.pluralName, name),
      ];
    },
  });
}
