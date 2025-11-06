import { Button } from "@/core/components/ui/button";
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
import { PATH_CDPIPELINE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/details/route";

export const FormActions = () => {
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

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
          to: PATH_CDPIPELINE_DETAILS_FULL,
          params: {
            clusterName,
            namespace: cdPipeline.metadata.namespace || defaultNamespace,
            name: cdPipeline.metadata.name,
          },
        },
      });

      handleClose();
    },
    [clusterName, defaultNamespace, handleClose, openSuccessDialog]
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

  const isDirty = Object.keys(dirtyFields).length;

  return (
    <div className="flex w-full flex-row justify-between gap-4">
      <div className="flex flex-row gap-2">
        <Button onClick={handleClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={handleResetFields} variant="ghost" size="sm" disabled={!isDirty}>
          Undo Changes
        </Button>
      </div>
      <div>
        <TabPanel value={activeStep} index={FORM_STEPPER.PIPELINE.idx}>
          <Button onClick={handleProceed} variant="default" size="sm">
            Next
          </Button>
        </TabPanel>
        <TabPanel value={activeStep} index={FORM_STEPPER.APPLICATIONS.idx}>
          <div className="flex flex-row gap-2">
            <Button onClick={prevStep} variant="ghost" size="sm">
              Back
            </Button>
            <Button
              onClick={handleSubmit(onSubmit, handleValidationError)}
              variant="default"
              size="sm"
              disabled={!isDirty || isLoading}
            >
              Create
            </Button>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};
