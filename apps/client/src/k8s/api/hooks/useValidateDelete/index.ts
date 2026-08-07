import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

/**
 * Asks the API server whether a resource may be deleted, via a dry-run delete that runs the
 * operators' validating webhooks without persisting anything. Used by
 * `DeleteKubeObjectDialog`'s `onBeforeSubmit`.
 */
export const useValidateDelete = () => {
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  return React.useCallback(
    (resource: KubeObjectBase, resourceConfig: K8sResourceConfig) =>
      trpc.k8s.validateDelete.mutate({
        clusterName,
        name: resource.metadata.name!,
        namespace: resource.metadata.namespace!,
        resourceConfig,
      }),
    [clusterName, trpc]
  );
};
