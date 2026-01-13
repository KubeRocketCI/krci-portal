import { EmptyList } from "@/core/components/EmptyList";
import { PodLogsTerminal } from "@/core/components/PodLogsTerminal";
import { Card } from "@/core/components/ui/card";
import { usePodWatchList } from "@/k8s/api/groups/Core/Pod";
import { routePipelineRunDetails } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { Pod } from "@my-project/shared";

const getDefaultContainer = (pod: Pod, stepName: string) => {
  return pod?.spec?.containers.find((container) => container.name.includes(stepName))?.name;
};

export const TaskRunStepLogs = ({ stepName, taskRunName }: { stepName: string; taskRunName: string }) => {
  const params = routePipelineRunDetails.useParams();
  const pipelineRunPodsWatch = usePodWatchList({
    labels: {
      "tekton.dev/pipelineRun": params.name,
    },
    namespace: params.namespace,
    queryOptions: {
      enabled: !!params.name,
    },
  });

  const pods = pipelineRunPodsWatch.data.array.filter(
    (pod) => pod.metadata?.labels?.["tekton.dev/taskRun"] === taskRunName
  );

  const defaultContainer = getDefaultContainer(pods?.[0], stepName);

  return pods.length > 0 ? (
    <PodLogsTerminal
      clusterName="default"
      namespace={pods[0]?.metadata?.namespace || "default"}
      pods={pods}
      selectedContainer={defaultContainer}
      height={400}
    />
  ) : (
    <Card className="h-full overflow-hidden">
      <EmptyList
        customText="No pods available for this step!"
        description="Pods are available only if the step is running."
      />
    </Card>
  );
};
