import { Box, Button, Stack, useTheme } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
// import { CDPIPELINE_FORM_NAMES } from "../../../../names";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
// import { ManageCDPipelineFormValues } from "../../../../types";
import { useCDPipelineCRUD } from "@/core/k8s/api/groups/KRCI/CDPipeline";

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
    // triggerEditCDPipeline,
    mutations: { cdPipelineEditMutation },
  } = useCDPipelineCRUD();

  const isLoading = React.useMemo(() => cdPipelineEditMutation.isPending, [cdPipelineEditMutation.isPending]);

  const onSubmit = React.useCallback(async () => {
    if (!CDPipeline) {
      return;
    }

    // await triggerEditCDPipeline({
    //   data: {
    //     cdPipeline: CDPipeline,
    //   },
    //   callbacks: {
    //     onSuccess: handleClose,
    //   },
    // });
  }, [CDPipeline]);

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
      <Button
        onClick={handleSubmit(onSubmit)}
        variant={"contained"}
        color={"primary"}
        size="small"
        disabled={!isDirty || isLoading}
      >
        apply
      </Button>
    </Stack>
  );
};
