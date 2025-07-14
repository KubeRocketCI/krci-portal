import { Chip, Grid, Stack, Typography, useTheme } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import clsx from "clsx";
import React from "react";
import { useStageWatch } from "../../../../../hooks/";
import { getStageStatusIcon } from "@/core/k8s/api/groups/KRCI/Stage";
import { StatusIcon } from "@/core/components/StatusIcon";
import { stageTriggerType } from "@my-project/shared";
import KubernetesIcon from "@/assets/icons/k8s/kubernetes.svg?react";
import { CopyButton } from "@/core/components/CopyButton";
import { Pipeline } from "@/modules/platform/pipelines/components/Pipeline";
import { STATUS_COLOR } from "@/core/k8s/constants/colors";

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

  const theme = useTheme();
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
            <Grid container spacing={1} alignItems={"center"}>
              <Grid item>
                <StatusIcon
                  Icon={stageStatusIcon.component}
                  color={stageStatusIcon.color}
                  isSpinning={stageStatusIcon.isSpinning}
                  width={20}
                  Title={
                    <>
                      <Typography variant={"subtitle2"} sx={{ fontWeight: 600 }}>
                        {`Status: ${stage.status?.status || "unknown"}`}
                      </Typography>
                      {!!stage.status?.detailed_message && (
                        <Typography variant={"subtitle2"} sx={{ mt: theme.typography.pxToRem(10) }}>
                          {stage.status?.detailed_message}
                        </Typography>
                      )}
                    </>
                  }
                />
              </Grid>
              <Grid item>
                <Typography variant={"body2"}>{stage.status?.status || "unknown"}</Typography>
              </Grid>
            </Grid>
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
            <Grid container spacing={1} alignItems={"center"}>
              <Grid item>
                <KubernetesIcon width={20} height={20} />
              </Grid>
              <Grid item>{stage.spec.clusterName}</Grid>
            </Grid>
          ),
        },
        {
          label: "Namespace",
          text: (
            <Stack direction="row" alignItems="center">
              {stage.spec.namespace} <CopyButton text={stage.spec.namespace} />
            </Stack>
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
    theme.typography,
  ]);
};
