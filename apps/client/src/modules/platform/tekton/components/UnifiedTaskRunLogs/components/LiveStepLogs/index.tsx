import { LogViewer } from "@/core/components/LogViewer";
import { EmptyList } from "@/core/components/EmptyList";
import { PodLogsTerminal } from "@/core/components/PodLogsTerminal";
import { Card } from "@/core/components/ui/card";
import { podLabels } from "@my-project/shared";
import { usePodWatchList } from "@/k8s/api/groups/Core/Pod";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { getDefaultContainer } from "../../../../utils/getDefaultContainer";

interface LiveStepLogsProps {
  stepName: string;
  taskRunName: string;
  namespace: string;
}

/**
 * Live step log viewer -- running pipelines ONLY.
 *
 * This component is only rendered when logRoute === "running"
 * (i.e., the PipelineRun has no completionTime).
 * All completed-pipeline log routing is handled upstream by UnifiedTaskRunLogs.
 */
export function LiveStepLogs({ stepName, taskRunName, namespace }: LiveStepLogsProps) {
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  const podWatch = usePodWatchList({
    labels: {
      [podLabels.taskRun]: taskRunName,
    },
    namespace,
    queryOptions: {
      enabled: !!taskRunName,
    },
  });

  const pods = podWatch.data.array;

  if (podWatch.isLoading) {
    return <LogViewer content="" isLoading loadingMessage="Looking for pods..." />;
  }

  if (pods.length > 0) {
    const defaultContainer = getDefaultContainer(pods[0], stepName);
    return (
      <PodLogsTerminal
        clusterName={clusterName}
        namespace={pods[0]?.metadata?.namespace || "default"}
        pods={pods}
        selectedContainer={defaultContainer}
        height={400}
      />
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <EmptyList
        customText="No pods available for this step"
        description="Pods are available only if the step is running."
      />
    </Card>
  );
}
