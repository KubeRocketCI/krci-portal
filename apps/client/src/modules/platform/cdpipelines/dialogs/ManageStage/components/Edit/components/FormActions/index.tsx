import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { STAGE_FORM_NAMES } from "../../../../names";
import { ManageStageFormValues } from "../../../../types";
import { editStageObject } from "@my-project/shared";

export const FormActions = () => {
  const {
    props: { stage },
    state: { closeDialog },
  } = useCurrentDialog();

  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useTypedFormContext();

  const handleClose = React.useCallback(() => {
    closeDialog();
    reset();
  }, [closeDialog, reset]);

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const {
    triggerEditStage,
    mutations: { stageEditMutation },
  } = useStageCRUD();

  const isPending = stageEditMutation.isPending;

  const onSuccess = React.useCallback(() => {
    handleClose();
  }, [handleClose]);

  const onSubmit = React.useCallback(
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
          onSuccess,
        },
      });
    },
    [stage, triggerEditStage, onSuccess]
  );

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
      <Button
        onClick={handleSubmit(onSubmit)}
        variant="default"
        size="sm"
        disabled={!isDirty || isPending}
      >
        Apply
      </Button>
    </div>
  );
};
