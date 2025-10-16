import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { GitLabPipelineVariable } from "@my-project/shared";
import { LoaderCircle, Play, Plus, Trash2 } from "lucide-react";
import React from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { DialogProps } from "@/core/providers/Dialog/types";

export const DIALOG_NAME = "GitLabBuildWithParams";

interface FormValues {
  variables: GitLabPipelineVariable[];
}

export type GitLabBuildWithParamsDialogProps = DialogProps<{
  triggerData: {
    gitServer: string;
    gitUrlPath: string;
    branchName: string;
  };
  onSubmit: (variables: GitLabPipelineVariable[]) => void;
  isLoading?: boolean;
}>;

export const GitLabBuildWithParamsDialog: React.FC<GitLabBuildWithParamsDialogProps> = ({ props, state }) => {
  const { triggerData, onSubmit, isLoading = false } = props;
  const { open, closeDialog } = state;

  const { control, handleSubmit, reset, register } = useForm<FormValues>({
    defaultValues: {
      variables: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variables" as const,
  });

  const handleAddVariable = React.useCallback(() => {
    append({ key: "", value: "" } as GitLabPipelineVariable);
  }, [append]);

  const handleDeleteVariable = React.useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  const onFormSubmit = React.useCallback(
    (values: FormValues) => {
      // Filter out empty variables
      const validVariables = values.variables.filter((v) => v.key.trim() !== "");

      onSubmit(validVariables);

      // Reset form after submit
      reset();
      closeDialog();
    },
    [onSubmit, reset, closeDialog]
  );

  const handleClose = React.useCallback(() => {
    reset();
    closeDialog();
  }, [closeDialog, reset]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogTitle>
          <Grid container alignItems="center" spacing={1}>
            <Grid item>
              <Play size={24} />
            </Grid>
            <Grid item>
              <Typography variant="h6">Build GitLab Pipeline with Parameters</Typography>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Git Server:</strong> {triggerData.gitServer}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Project:</strong> {triggerData.gitUrlPath}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Branch:</strong> {triggerData.branchName}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Pipeline Variables
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Add key-value pairs to pass as environment variables to the GitLab CI pipeline.
              </Typography>
            </Grid>

            {fields.length > 0 && (
              <Grid item xs={12}>
                <Stack spacing={2}>
                  {fields.map((field, index) => (
                    <Grid container spacing={2} alignItems="flex-start" key={field.id}>
                      <Grid item xs={5}>
                        <FormTextField
                          {...register(`variables.${index}.key`, {
                            required: "Key is required",
                          })}
                          label="Key"
                          placeholder="e.g. BUILD_TYPE"
                          control={control as unknown as Control}
                          errors={{}}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <FormTextField
                          {...register(`variables.${index}.value`)}
                          label="Value"
                          placeholder="e.g. release"
                          control={control as unknown as Control}
                          errors={{}}
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton
                          onClick={() => handleDeleteVariable(index)}
                          size="small"
                          color="error"
                          sx={{ mt: 1 }}
                        >
                          <Trash2 size={20} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                type="button"
                variant="outlined"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={handleAddVariable}
              >
                Add Variable
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            startIcon={isLoading ? <LoaderCircle size={20} /> : <Play size={20} />}
          >
            {isLoading ? "Triggering..." : "Trigger Pipeline"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

GitLabBuildWithParamsDialog.displayName = DIALOG_NAME;
