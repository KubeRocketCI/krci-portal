import React from "react";
import { Button } from "@/core/components/ui/button";
import { useFormContext } from "react-hook-form";
import { useCDPipelineCRUD } from "@/k8s/api/groups/KRCI/CDPipeline";
import { editCDPipelineObject } from "@my-project/shared";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { dialogName } from "../constants";
import { CDPipeline } from "@my-project/shared";
import { EditCDPipelineFormValues } from "../types";

interface FormActionsProps {
  cdPipeline: CDPipeline;
}

export const FormActions: React.FC<FormActionsProps> = ({ cdPipeline }) => {
  const { closeDialog } = useDialogContext();
  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useFormContext<EditCDPipelineFormValues>();

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const handleClose = React.useCallback(() => {
    closeDialog(dialogName);
    reset();
  }, [closeDialog, reset]);

  const {
    triggerEditCDPipeline,
    mutations: { cdPipelineEditMutation },
  } = useCDPipelineCRUD();

  const isPending = cdPipelineEditMutation.isPending;

  const onSuccess = React.useCallback(() => {
    handleClose();
  }, [handleClose]);

  const onSubmit = React.useCallback(
    async (values: EditCDPipelineFormValues) => {
      if (!cdPipeline) {
        return;
      }

      const updatedCDPipeline = editCDPipelineObject(cdPipeline, {
        description: values.description,
        applications: values.applications,
        inputDockerStreams: values.inputDockerStreams,
        applicationsToPromote: values.applicationsToPromote,
      });

      await triggerEditCDPipeline({
        data: {
          cdPipeline: updatedCDPipeline,
        },
        callbacks: {
          onSuccess,
        },
      });
    },
    [cdPipeline, triggerEditCDPipeline, onSuccess]
  );

  return (
    <div className="flex w-full justify-between gap-2">
      <div className="flex gap-1">
        <Button onClick={handleClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={handleResetFields} variant="ghost" size="sm" disabled={!isDirty}>
          Undo Changes
        </Button>
      </div>
      <Button variant="default" size="sm" disabled={!isDirty || isPending} onClick={handleSubmit(onSubmit)}>
        Apply
      </Button>
    </div>
  );
};
