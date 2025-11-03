import { Chip } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import clsx from "clsx";
import React from "react";
import { useStageWatch } from "../../../../../hooks/";
import { getStageStatusIcon } from "@/k8s/api/groups/KRCI/Stage";
import { StatusIcon } from "@/core/components/StatusIcon";
import { stageTriggerType } from "@my-project/shared";
import KubernetesIcon from "@/assets/icons/k8s/kubernetes.svg?react";
import { CopyButton } from "@/core/components/CopyButton";
import { Pipeline } from "@/modules/platform/pipelines/components/Pipeline";
import { STATUS_COLOR } from "@/k8s/constants/colors";

const useStyles = makeStyles((theme) => ({
  labelChip: {
    height: theme.typography.pxToRem(24),
    lineHeight: 1,
    paddingTop: theme.typography.pxToRem(2),
  },
  labelChipBlue: {
    backgroundColor: STATUS_COLOR.SUCCESS,
    color: "#fff",
  },
  labelChipGreen: {
    backgroundColor: STATUS_COLOR.SUCCESS,
    color: "#fff",
  },
}));

export const useInfoColumns = () => {
  const stageWatch = useStageWatch();

  const classes = useStyles();

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
              <Chip label="manual" className={clsx([classes.labelChip, classes.labelChipBlue])} />
            ) : (
              <Chip label="auto" className={clsx([classes.labelChip, classes.labelChipGreen])} />
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
  }, [
    classes.labelChip,
    classes.labelChipBlue,
    classes.labelChipGreen,
    stageWatch.query.data,
    stageWatch.query.isLoading,
  ]);
};
