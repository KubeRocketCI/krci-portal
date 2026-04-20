import { useMutation } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export function useApplyYaml() {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  return useMutation({
    mutationFn: (resources: Record<string, unknown>[]) => {
      const resourcesWithNamespace = resources.map((resource) => {
        const metadata = resource["metadata"] as Record<string, unknown> | undefined;
        if (metadata && !metadata["namespace"]) {
          const cloned = structuredClone(resource);
          (cloned["metadata"] as Record<string, unknown>)["namespace"] = defaultNamespace;
          return cloned;
        }
        return resource;
      });

      return trpc.k8s.applyYaml.mutate({ clusterName, resources: resourcesWithNamespace });
    },
  });
}
