import { Button } from "@/core/components/ui/button";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CDPIPELINE_FORM_NAMES } from "../../../../names";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { ManageCDPipelineFormValues } from "../../../../types";
import { useCDPipelineCRUD } from "@/k8s/api/groups/KRCI/CDPipeline";
import { editCDPipelineObject } from "@my-project/shared";

export const FormActions = () => {
  const {
    props: { CDPipeline },
    state: { closeDialog },
  } = useCurrentDialog();
  const {
    reset,
    formState: { dirtyFields },
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
    triggerEditCDPipeline,
    mutations: { cdPipelineEditMutation },
  } = useCDPipelineCRUD();

  const isPending = cdPipelineEditMutation.isPending;

  const onSuccess = React.useCallback(() => {
    handleClose();
  }, [handleClose]);

  const onSubmit = React.useCallback(
    async (values: ManageCDPipelineFormValues) => {
      if (!CDPipeline) {
        return;
      }

      const updatedCDPipeline = editCDPipelineObject(CDPipeline, {
        description: values[CDPIPELINE_FORM_NAMES.description.name],
        applications: values[CDPIPELINE_FORM_NAMES.applications.name],
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
    [CDPipeline, triggerEditCDPipeline, onSuccess]
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
