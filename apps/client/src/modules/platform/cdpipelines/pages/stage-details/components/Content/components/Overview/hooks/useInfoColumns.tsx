import { Badge } from "@/core/components/ui/badge";
import React from "react";
import { useStageWatch } from "../../../../../hooks/";
import { getStageStatusIcon } from "@/k8s/api/groups/KRCI/Stage";
import { StatusIcon } from "@/core/components/StatusIcon";
import { stageTriggerType } from "@my-project/shared";
import KubernetesIcon from "@/assets/icons/k8s/kubernetes.svg?react";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { PipelinePreview } from "@/core/components/PipelinePreview";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";
import { STATUS_COLOR } from "@/k8s/constants/colors";

export interface GridItem {
  label: string;
  content: React.ReactNode;
  colSpan?: number;
}

export const useInfoColumns = (): GridItem[] => {
  const stageWatch = useStageWatch();
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);

  return React.useMemo(() => {
    if (stageWatch.query.isFetching || !stageWatch.query.data) {
      return [];
    }

    const stageStatusIcon = getStageStatusIcon(stageWatch.query.data);

    const stage = stageWatch.query.data;

    return [
      {
        label: "Status",
        content: (
          <div className="flex items-center gap-1.5">
            <StatusIcon
              Icon={stageStatusIcon.component}
              color={stageStatusIcon.color}
              isSpinning={stageStatusIcon.isSpinning}
              width={14}
              Title={
                <>
                  <p className="text-sm font-semibold">{`Status: ${stage.status?.status || "unknown"}`}</p>
                  {!!stage.status?.detailed_message && (
                    <p className="mt-3 text-sm font-medium">{stage.status?.detailed_message}</p>
                  )}
                </>
              }
            />
            <span className="text-foreground text-sm">{stage.status?.status || "unknown"}</span>
          </div>
        ),
      },
      {
        label: "Trigger Type",
        content:
          stage.spec.triggerType === stageTriggerType.Manual ? (
            <Badge
              variant="outline"
              className="h-6"
              style={{ "--border-color": STATUS_COLOR.SUCCESS } as React.CSSProperties}
            >
              manual
            </Badge>
          ) : (
            <Badge
              variant="outline"
              style={
                {
                  "--border-color": STATUS_COLOR.SUCCESS,
                } as React.CSSProperties
              }
              className="h-6 border-(--border-color)"
            >
              auto
            </Badge>
          ),
      },
      {
        label: "Cluster",
        content: (
          <div className="flex items-center gap-1.5">
            <KubernetesIcon width={14} height={14} className="text-muted-foreground" />
            <span className="text-foreground text-sm">{stage.spec.clusterName}</span>
          </div>
        ),
      },
      {
        label: "Namespace",
        content: <ScrollCopyText text={stage.spec.namespace} />,
      },
      {
        label: "Deploy Pipeline",
        content: stage.spec?.triggerTemplate ? (
          <PipelinePreview
            pipelineName={stage.spec.triggerTemplate}
            namespace={stage.metadata.namespace!}
            onViewDiagram={(pipelineName, namespace) =>
              openPipelineGraphDialog({
                pipelineName,
                namespace,
              })
            }
          />
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        ),
        colSpan: 2,
      },
      {
        label: "Clean Pipeline",
        content: stage.spec?.cleanTemplate ? (
          <PipelinePreview
            pipelineName={stage.spec.cleanTemplate}
            namespace={stage.metadata.namespace!}
            onViewDiagram={(pipelineName, namespace) =>
              openPipelineGraphDialog({
                pipelineName,
                namespace,
              })
            }
          />
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        ),
        colSpan: 2,
      },
      {
        label: "Description",
        content: <span className="text-foreground text-sm">{stage.spec.description || "N/A"}</span>,
        colSpan: 4,
      },
    ];
  }, [stageWatch.query.data, stageWatch.query.isFetching, openPipelineGraphDialog]);
};
