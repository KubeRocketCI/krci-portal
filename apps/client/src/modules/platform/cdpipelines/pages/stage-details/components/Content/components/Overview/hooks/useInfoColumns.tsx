import { Badge } from "@/core/components/ui/badge";
import React from "react";
import { useStageWatch } from "../../../../../hooks/";
import { getStageStatusIcon } from "@/k8s/api/groups/KRCI/Stage";
import { StatusIcon } from "@/core/components/StatusIcon";
import { stageTriggerType } from "@my-project/shared";
import KubernetesIcon from "@/assets/icons/k8s/kubernetes.svg?react";
import { CopyButton } from "@/core/components/CopyButton";
import { Pipeline } from "@/modules/platform/pipelines/components/Pipeline";

export const useInfoColumns = () => {
  const stageWatch = useStageWatch();

  return React.useMemo(() => {
    if (stageWatch.query.isLoading || !stageWatch.query.data) {
      return [];
    }

    const stageStatusIcon = getStageStatusIcon(stageWatch.query.data);

    const stage = stageWatch.query.data;

    return [
      [
        {
          label: "Status",
          text: (
            <div className="flex items-center gap-2">
              <div>
                <StatusIcon
                  Icon={stageStatusIcon.component}
                  color={stageStatusIcon.color}
                  isSpinning={stageStatusIcon.isSpinning}
                  width={20}
                  Title={
                    <>
                      <p className="text-sm font-semibold">{`Status: ${stage.status?.status || "unknown"}`}</p>
                      {!!stage.status?.detailed_message && (
                        <p className="mt-3 text-sm font-medium">{stage.status?.detailed_message}</p>
                      )}
                    </>
                  }
                />
              </div>
              <div>
                <p className="text-sm">{stage.status?.status || "unknown"}</p>
              </div>
            </div>
          ),
        },
        {
          label: "Trigger Type",
          text:
            stage.spec.triggerType === stageTriggerType.Manual ? (
              <Badge variant="default" className="h-6 bg-green-600 hover:bg-green-700">manual</Badge>
            ) : (
              <Badge variant="default" className="h-6 bg-green-600 hover:bg-green-700">auto</Badge>
            ),
        },
        {
          label: "Cluster",
          text: (
            <div className="flex items-center gap-2">
              <div>
                <KubernetesIcon width={20} height={20} />
              </div>
              <div>{stage.spec.clusterName}</div>
            </div>
          ),
        },
        {
          label: "Namespace",
          text: (
            <div className="flex items-center">
              {stage.spec.namespace} <CopyButton text={stage.spec.namespace} />
            </div>
          ),
        },
        {
          label: "Deploy Pipeline",
          text: stage.spec?.triggerTemplate && (
            <Pipeline pipelineName={stage.spec.triggerTemplate} namespace={stage.metadata.namespace!} />
          ),
        },
        {
          label: "Clean Pipeline",
          text: stage.spec?.cleanTemplate && (
            <Pipeline pipelineName={stage.spec.cleanTemplate} namespace={stage.metadata.namespace!} />
          ),
        },
        {
          label: "Description",
          text: stage.spec.description,
          columnXs: 6,
        },
      ],
    ];
  }, [stageWatch.query.data, stageWatch.query.isLoading]);
};
