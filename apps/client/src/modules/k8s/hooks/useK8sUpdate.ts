import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { useTRPCClient } from "@/core/providers/trpc";
import { showToast } from "@/core/components/Snackbar";
import { useClusterStore } from "@/k8s/store";
import type { K8sResourceConfig } from "@my-project/shared";

interface UpdateInput {
  namespace: string;
  name: string;
  body: unknown;
}

export function useK8sUpdate(config: K8sResourceConfig) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  return useMutation({
    mutationFn: ({ namespace, name, body }: UpdateInput) =>
      trpc.k8s.update.mutate({
        clusterName,
        namespace,
        name,
        resourceConfig: config,
        resource: body,
      }),
    onSuccess: () => {
      // Broad invalidation; refine once watch hooks expose deterministic query keys.
      queryClient.invalidateQueries();
      showToast(`${config.kind} updated`, "success");
    },
    onError: (err: unknown) => {
      const e = err as { data?: { code?: string }; message?: string };
      const isConflict = e?.data?.code === "CONFLICT" || (typeof e?.message === "string" && e.message.includes("409"));
      if (isConflict) {
        showToast("Resource changed since you opened it. Reload and re-apply.", "error");
      } else {
        showToast(e?.message ?? "Update failed", "error");
      }
    },
  });
}
