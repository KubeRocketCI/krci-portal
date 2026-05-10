import { PodLogsTerminal } from "@/core/components/PodLogsTerminal";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import type { Pod } from "@my-project/shared";

export function LogsTab({ pod, container }: { pod: Pod; container: string }) {
  const { clusterName } = useClusterStore(useShallow((s) => ({ clusterName: s.clusterName })));
  return (
    <div className="flex flex-col p-4">
      <PodLogsTerminal
        clusterName={clusterName}
        namespace={pod.metadata?.namespace ?? ""}
        pods={[pod]}
        selectedContainer={container || undefined}
        selectedPod={pod.metadata?.name}
      />
    </div>
  );
}
