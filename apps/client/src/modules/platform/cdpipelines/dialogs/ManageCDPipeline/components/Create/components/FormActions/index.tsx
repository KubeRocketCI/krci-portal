import { Box, Button, Stack, useTheme } from "@mui/material";
import React from "react";
import { FORM_STEPPER } from "../../../../constants";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CDPIPELINE_FORM_NAMES, NAMES } from "../../../../names";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { ManageCDPipelineFormValues } from "../../../../types";
import { TabPanel } from "@/core/components/TabPanel";
import { useCDPipelineCRUD } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { ValueOf } from "@/core/types/global";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { CDPipelineDraft, createCDPipelineDraftObject } from "@my-project/shared";
import { SuccessDialog } from "@/modules/platform/codebases/dialogs/Success";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";

export const FormActions = () => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const {
    state: { closeDialog },
  } = useCurrentDialog();
  const { activeStep, setActiveStep, nextStep, prevStep } = useStepperContext();

  const {
    reset,
    formState: { dirtyFields },
    trigger,
    handleSubmit,
  } = useTypedFormContext();

  const handleClose = React.useCallback(() => {
    closeDialog();
    reset();
  }, [closeDialog, reset]);

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const activeTabFormPartName = React.useMemo(() => {
    const validEntry = Object.entries(FORM_STEPPER).find(([, { idx }]) => idx === activeStep);
    return validEntry?.[0];
  }, [activeStep]);

  const handleProceed = React.useCallback(async () => {
    const activeTabFormPartNames = Object.values(CDPIPELINE_FORM_NAMES)
      .filter(({ formPart }) => formPart === activeTabFormPartName)
      .map(({ name }) => name);

    const hasNoErrors = await trigger(activeTabFormPartNames);

    if (hasNoErrors) {
      nextStep();
    }
  }, [activeTabFormPartName, nextStep, trigger]);

  const getFirstErrorStepName = (errors: Record<string, unknown>) => {
    const [firstErrorFieldName] = Object.keys(errors);
    return CDPIPELINE_FORM_NAMES[firstErrorFieldName as ValueOf<typeof NAMES>].formPart;
  };

  const handleValidationError = React.useCallback(
    (errors: Record<string, unknown>) => {
      if (errors) {
        const firstErrorTabName = getFirstErrorStepName(errors);
        setActiveStep(FORM_STEPPER[firstErrorTabName].idx);
      }
    },
    [setActiveStep]
  );

  const openSuccessDialog = useDialogOpener(SuccessDialog);

  const onSuccess = React.useCallback(
    (cdPipeline: CDPipelineDraft) => {
      openSuccessDialog({
        dialogTitle: "Create Deployment Flow",
        title: "Your new Deployment Flow is created",
        description: "Kickstart application rollouts by adding Environments to your Deployment Flow.",
        route: {
          to: routeCDPipelineDetails.to,
          params: { clusterName, namespace: cdPipeline.metadata.namespace, name: cdPipeline.metadata.name },
        },
      });

      handleClose();
    },
    [clusterName, handleClose, openSuccessDialog]
  );

  const {
    triggerCreateCDPipeline,
    mutations: { cdPipelineCreateMutation },
  } = useCDPipelineCRUD();

  const isLoading = React.useMemo(() => cdPipelineCreateMutation.isPending, [cdPipelineCreateMutation.isPending]);

  const onSubmit = React.useCallback(
    (values: ManageCDPipelineFormValues) => {
      const newCDPipeline = createCDPipelineDraftObject({
        name: values.name,
        applications: values.applications,
        deploymentType: values.deploymentType,
        inputDockerStreams: values.inputDockerStreams,
        applicationsToPromote: values.applicationsToPromote,
        description: values.description,
      });

      triggerCreateCDPipeline({
        data: {
          cdPipeline: newCDPipeline,
        },
        callbacks: {
          onSuccess: () => onSuccess(newCDPipeline),
        },
      });
    },
    [onSuccess, triggerCreateCDPipeline]
  );

  const theme = useTheme();

  const isDirty = Object.keys(dirtyFields).length;

  return (
    <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
      <Stack direction="row" spacing={1}>
        <Box sx={{ color: theme.palette.text.primary }}>
          <Button onClick={handleClose} size="small" color="inherit">
            cancel
          </Button>
        </Box>
        <Button onClick={handleResetFields} size="small" disabled={!isDirty}>
          undo changes
        </Button>
      </Stack>
      <div>
        <TabPanel value={activeStep} index={FORM_STEPPER.PIPELINE.idx}>
          <Button onClick={handleProceed} variant={"contained"} color={"primary"} size="small">
            next
          </Button>
        </TabPanel>
        <TabPanel value={activeStep} index={FORM_STEPPER.APPLICATIONS.idx}>
          <Stack direction="row">
            <Button onClick={prevStep} size="small">
              back
            </Button>
            <Button
              onClick={handleSubmit(onSubmit, handleValidationError)}
              variant={"contained"}
              color={"primary"}
              size="small"
              disabled={!isDirty || isLoading}
            >
              create
            </Button>
          </Stack>
        </TabPanel>
      </div>
    </Stack>
  );
};
