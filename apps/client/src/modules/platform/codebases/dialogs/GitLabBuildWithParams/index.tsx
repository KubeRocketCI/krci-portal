import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
          <div className="flex items-center gap-2">
            <div>
              <Play size={24} />
            </div>
            <div>
              <h6 className="text-base font-medium">Build GitLab Pipeline with Parameters</h6>
            </div>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Git Server:</strong> {triggerData.gitServer}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Project:</strong> {triggerData.gitUrlPath}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Branch:</strong> {triggerData.branchName}
              </p>
            </div>

            <div>
              <h6 className="text-base font-medium mt-2 mb-2">
                Pipeline Variables
              </h6>
              <p className="text-sm text-muted-foreground mb-2">
                Add key-value pairs to pass as environment variables to the GitLab CI pipeline.
              </p>
            </div>

            {fields.length > 0 && (
              <div>
                <div className="flex flex-col gap-2">
                  {fields.map((field, index) => (
                    <div className="grid grid-cols-12 gap-4 items-start" key={field.id}>
                      <div className="col-span-5">
                        <FormTextField
                          {...register(`variables.${index}.key`, {
                            required: "Key is required",
                          })}
                          label="Key"
                          placeholder="e.g. BUILD_TYPE"
                          control={control as unknown as Control}
                          errors={{}}
                        />
                      </div>
                      <div className="col-span-6">
                        <FormTextField
                          {...register(`variables.${index}.value`)}
                          label="Value"
                          placeholder="e.g. release"
                          control={control as unknown as Control}
                          errors={{}}
                        />
                      </div>
                      <div className="col-span-1">
                        <IconButton
                          onClick={() => handleDeleteVariable(index)}
                          size="small"
                          color="error"
                          sx={{ mt: 1 }}
                        >
                          <Trash2 size={20} />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Button
                type="button"
                variant="outlined"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={handleAddVariable}
              >
                Add Variable
              </Button>
            </div>
          </div>
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
