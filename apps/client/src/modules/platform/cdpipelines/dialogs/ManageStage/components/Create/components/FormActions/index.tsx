import { TabPanel } from "@/core/components/TabPanel";
import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { SuccessDialog } from "@/modules/platform/codebases/dialogs/Success";
import { Button } from "@/core/components/ui/button";
import { createStageDraftObject, StageDraft } from "@my-project/shared";
import React from "react";
import { FORM_STEPPER } from "../../../../constants";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { STAGE_FORM_NAMES } from "../../../../names";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { ManageStageFormValues } from "../../../../types";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export const FormActions = () => {
  const { defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const openSuccessDialog = useDialogOpener(SuccessDialog);

  const {
    props: { cdPipeline },
    state: { closeDialog },
  } = useCurrentDialog();

  const {
    reset,
    formState: { isDirty },
    watch,
    handleSubmit,
    trigger,
  } = useTypedFormContext();

  const handleClose = React.useCallback(() => {
    closeDialog();
    reset();
  }, [closeDialog, reset]);

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const onSuccess = React.useCallback(
    (stage: StageDraft) => {
      if (!stage || !cdPipeline) return;

      openSuccessDialog({
        dialogTitle: `Create Environment`,
        title: `Your new Environment is created`,
        description: `Browse your new Environment and start working with it.`,
        route: {
          to: routeStageDetails.fullPath,
          params: {
            namespace: stage.metadata.namespace || defaultNamespace,
            stage: stage.spec.name,
            cdPipeline: cdPipeline.metadata.name,
          },
        },
      });

      handleClose();
    },
    [cdPipeline, defaultNamespace, handleClose, openSuccessDialog]
  );

  const {
    triggerCreateStage,
    mutations: { stageCreateMutation },
  } = useStageCRUD();

  const isLoading = React.useMemo(() => stageCreateMutation.isPending, [stageCreateMutation.isPending]);

  const onSubmit = React.useCallback(
    async (values: ManageStageFormValues) => {
      const newStage = createStageDraftObject({
        name: values.name,
        description: values.description,
        qualityGates: values.qualityGates.map((el) => ({
          qualityGateType: el.qualityGateType,
          stepName: el.stepName,
          autotestName: el.autotestName,
          branchName: el.branchName,
        })),
        cdPipeline: values.cdPipeline,
        namespace: values.deployNamespace,
        clusterName: values.cluster,
        order: values.order,
        source: {
          type: values.sourceType,
          library: {
            name: values.sourceLibraryName,
            branch: values.sourceLibraryBranch,
          },
        },
        triggerTemplate: values.triggerTemplate,
        cleanTemplate: values.cleanTemplate,
        triggerType: values.triggerType,
      });

      await triggerCreateStage({
        data: {
          stage: newStage,
        },
        callbacks: {
          onSuccess: () => onSuccess(newStage),
        },
      });
    },
    [onSuccess, triggerCreateStage]
  );

  const qualityGatesFieldValue = watch(STAGE_FORM_NAMES.qualityGates.name);

  const { activeStep, nextStep, prevStep } = useStepperContext();

  const activeTabFormPartName = React.useMemo(() => {
    const validEntry = Object.entries(FORM_STEPPER).find(([, { idx }]) => idx === activeStep);
    return validEntry?.[0];
  }, [activeStep]);

  const handleProceed = React.useCallback(async () => {
    const activeTabFormPartNames = Object.values(STAGE_FORM_NAMES)
      // @ts-expect-error - TODO: fix this
      .filter(({ formPart }) => formPart === activeTabFormPartName)
      .map(({ name }) => name);

    const hasNoErrors = await trigger(activeTabFormPartNames);

    if (hasNoErrors) {
      nextStep();
    }
  }, [activeTabFormPartName, nextStep, trigger]);

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
        <TabPanel value={activeStep} index={FORM_STEPPER.CONFIGURATION.idx}>
          <Button onClick={handleProceed} variant="default" size="sm">
            Next
          </Button>
        </TabPanel>
        <TabPanel value={activeStep} index={FORM_STEPPER.QUALITY_GATES.idx}>
          <div className="flex flex-row gap-2">
            <Button onClick={prevStep} variant="ghost" size="sm">
              Back
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="default"
              size="sm"
              disabled={!isDirty || isLoading || !qualityGatesFieldValue || !qualityGatesFieldValue.length}
            >
              Create
            </Button>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};
