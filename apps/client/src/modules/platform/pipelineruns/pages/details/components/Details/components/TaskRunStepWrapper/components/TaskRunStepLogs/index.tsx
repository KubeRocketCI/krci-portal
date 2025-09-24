import { PodLogsTerminal } from "@/core/components/PodLogsTerminal";
import { usePodWatchList } from "@/k8s/api/groups/Core/Pod";
import { routePipelineRunDetails } from "@/modules/platform/pipelineruns/pages/details/route";
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

  const pods = pipelineRunPodsWatch.dataArray.filter(
    (pod) => pod.metadata?.labels?.["tekton.dev/taskRun"] === taskRunName
  );

  const defaultContainer = getDefaultContainer(pods?.[0], stepName);

  return pods.length > 0 ? (
    <PodLogsTerminal
      key={defaultContainer}
      clusterName="default"
      namespace={pods[0]?.metadata?.namespace || "default"}
      pods={pods}
      selectedContainer={defaultContainer}
      height={400}
    />
  ) : (
    <div style={{ padding: 16, textAlign: "center", color: "#666" }}>No pods available for this step</div>
  );
};
