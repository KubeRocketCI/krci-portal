import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import React from "react";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { StageFormProvider } from "../../providers/form/provider";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { editStageObject } from "@my-project/shared";
import { STAGE_FORM_NAMES } from "../../names";
import { ManageStageFormValues } from "../../types";
import { showToast } from "@/core/components/Snackbar";

export const Edit = () => {
  const baseDefaultValues = useDefaultValues();

  const {
    props: { stage },
    state: { closeDialog },
  } = useCurrentDialog();

  const { triggerEditStage } = useStageCRUD();

  const handleSubmit = React.useCallback(
    async (values: ManageStageFormValues) => {
      if (!stage) {
        return;
      }

      const updatedStage = editStageObject(stage, {
        triggerType: values[STAGE_FORM_NAMES.triggerType.name],
        triggerTemplate: values[STAGE_FORM_NAMES.triggerTemplate.name],
        cleanTemplate: values[STAGE_FORM_NAMES.cleanTemplate.name],
      });

      await triggerEditStage({
        data: {
          stage: updatedStage,
        },
        callbacks: {
          onSuccess: closeDialog,
        },
      });
    },
    [stage, triggerEditStage, closeDialog]
  );

  const onSubmitError = React.useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast("Failed to update environment", "error", {
      description: errorMessage,
      duration: 10000,
    });
  }, []);

  return (
    <StageFormProvider defaultValues={baseDefaultValues} onSubmit={handleSubmit} onSubmitError={onSubmitError}>
      <DialogHeader>
        <CustomDialogHeader />
      </DialogHeader>
      <DialogBody>
        <Form />
      </DialogBody>
      <DialogFooter>
        <FormActions />
      </DialogFooter>
    </StageFormProvider>
  );
};
