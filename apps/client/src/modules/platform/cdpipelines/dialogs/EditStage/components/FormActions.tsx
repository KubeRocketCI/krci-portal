import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES, CreateStageFormValues } from "../../../pages/stages/create/components/CreateStageWizard/names";
import { editStageObject, Stage } from "@my-project/shared";

interface FormActionsProps {
  stage: Stage | undefined;
  closeDialog: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ stage, closeDialog }) => {
  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useFormContext<CreateStageFormValues>();

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
    async (values: CreateStageFormValues) => {
      if (!stage) {
        return;
      }

      const updatedStage = editStageObject(stage, {
        triggerType: values[NAMES.triggerType] as "Auto" | "Manual" | "Auto-stable",
        triggerTemplate: values[NAMES.triggerTemplate],
        cleanTemplate: values[NAMES.cleanTemplate],
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
      <Button onClick={handleSubmit(onSubmit)} variant="default" size="sm" disabled={!isDirty || isPending}>
        Apply
      </Button>
    </div>
  );
};
