import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { Box, Button, Stack, useTheme } from "@mui/material";
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

  const theme = useTheme();

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
      <Button
        onClick={handleSubmit(onSubmit)}
        variant={"contained"}
        color={"primary"}
        size="small"
        disabled={!isDirty || isPending}
      >
        apply
      </Button>
    </Stack>
  );
};
