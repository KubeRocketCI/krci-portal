import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
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
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm">
                <strong>Git Server:</strong> {triggerData.gitServer}
              </p>
              <p className="text-muted-foreground mb-2 text-sm">
                <strong>Project:</strong> {triggerData.gitUrlPath}
              </p>
              <p className="text-muted-foreground mb-2 text-sm">
                <strong>Branch:</strong> {triggerData.branchName}
              </p>
            </div>

            <div>
              <h6 className="mt-2 mb-2 text-base font-medium">Pipeline Variables</h6>
              <p className="text-muted-foreground mb-2 text-sm">
                Add key-value pairs to pass as environment variables to the GitLab CI pipeline.
              </p>
            </div>

            {fields.length > 0 && (
              <div>
                <div className="flex flex-col gap-2">
                  {fields.map((field, index) => (
                    <div className="grid grid-cols-12 items-start gap-4" key={field.id}>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVariable(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1"
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddVariable}>
                <Plus size={16} />
                Add Variable
              </Button>
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button type="button" onClick={handleClose} variant="ghost" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant="default" disabled={isLoading} onClick={handleSubmit(onFormSubmit)}>
            {isLoading ? <LoaderCircle size={20} /> : <Play size={20} />}
            {isLoading ? "Triggering..." : "Trigger Pipeline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

GitLabBuildWithParamsDialog.displayName = DIALOG_NAME;
