import { useStageCRUD } from '@/core/k8s/api/groups/KRCI/Stage';
import { Box, Button, Stack, useTheme } from '@mui/material';
import React from 'react';
import { useTypedFormContext } from '../../../../hooks/useFormContext';
import { useCurrentDialog } from '../../../../providers/CurrentDialog/hooks';

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
    // triggerEditStage,
    mutations: { stageEditMutation },
  } = useStageCRUD();

  const isLoading = React.useMemo(() => stageEditMutation.isPending, [stageEditMutation.isPending]);

  const onSubmit = React.useCallback(
    async () => {
      if (!stage) {
        return;
      }

      // const usedValues = getUsedValues(values, STAGE_FORM_NAMES);
      // const stageData = editResource(STAGE_FORM_NAMES, stage, usedValues);

      // await editStage({ stageData });
    },
    [stage]
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
        variant={'contained'}
        color={'primary'}
        size="small"
        disabled={!isDirty || isLoading}
      >
        apply
      </Button>
    </Stack>
  );
};
