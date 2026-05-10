import { PodExecTerminal } from "@/core/components/PodExecTerminal";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import type { Pod } from "@my-project/shared";

export function ShellTab({ pod, container }: { pod: Pod; container: string }) {
  const { clusterName } = useClusterStore(useShallow((s) => ({ clusterName: s.clusterName })));
  return (
    <div className="flex flex-col p-4">
      <PodExecTerminal
        clusterName={clusterName}
        namespace={pod.metadata?.namespace ?? ""}
        pods={[pod]}
        selectedPod={pod.metadata?.name}
        container={container || undefined}
      />
    </div>
  );
}
