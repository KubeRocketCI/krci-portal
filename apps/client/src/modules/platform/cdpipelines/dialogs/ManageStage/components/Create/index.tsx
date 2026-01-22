import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import React from "react";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { UnifiedStepper } from "./components/UnifiedStepper";
import { StageFormProvider } from "../../providers/form/provider";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { createStageDraftObject } from "@my-project/shared";
import { ManageStageFormValues } from "../../types";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { SuccessDialog } from "@/modules/platform/codebases/dialogs/Success";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { showToast } from "@/core/components/Snackbar";

export const Create = () => {
  const defaultValues = useDefaultValues();

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

  const { triggerCreateStage } = useStageCRUD();

  const handleSubmit = React.useCallback(
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
          onSuccess: () => {
            if (!newStage || !cdPipeline) return;

            openSuccessDialog({
              dialogTitle: `Create Environment`,
              title: `Your new Environment is created`,
              description: `Browse your new Environment and start working with it.`,
              route: {
                to: routeStageDetails.fullPath,
                params: {
                  namespace: newStage.metadata.namespace || defaultNamespace,
                  stage: newStage.spec.name,
                  cdPipeline: cdPipeline.metadata.name,
                },
              },
            });

            closeDialog();
          },
        },
      });
    },
    [triggerCreateStage, cdPipeline, defaultNamespace, openSuccessDialog, closeDialog]
  );

  const onSubmitError = React.useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast("Failed to create environment", "error", {
      description: errorMessage,
      duration: 10000,
    });
  }, []);

  return (
    <StageFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={onSubmitError}>
      <StepperContextProvider>
        <DialogHeader>
          <div className="flex w-full flex-col gap-4">
            <CustomDialogHeader />
            <UnifiedStepper />
          </div>
        </DialogHeader>
        <DialogBody>
          <Form />
        </DialogBody>
        <DialogFooter>
          <FormActions />
        </DialogFooter>
      </StepperContextProvider>
    </StageFormProvider>
  );
};
