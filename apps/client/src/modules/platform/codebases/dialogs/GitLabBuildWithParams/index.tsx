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
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { DialogProps } from "@/core/providers/Dialog/types";

export const DIALOG_NAME = "GitLabBuildWithParams";

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

  const [variables, setVariables] = React.useState<GitLabPipelineVariable[]>([]);

  const handleAddVariable = React.useCallback(() => {
    setVariables((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  const handleDeleteVariable = React.useCallback((index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyChange = React.useCallback((index: number, newKey: string) => {
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, key: newKey } : v)));
  }, []);

  const handleValueChange = React.useCallback((index: number, newValue: string) => {
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, value: newValue } : v)));
  }, []);

  const onFormSubmit = React.useCallback(() => {
    // Filter out empty variables
    const validVariables = variables.filter((v) => v.key.trim() !== "");

    onSubmit(validVariables);

    // Reset form after submit
    setVariables([]);
    closeDialog();
  }, [onSubmit, variables, closeDialog]);

  const handleClose = React.useCallback(() => {
    setVariables([]);
    closeDialog();
  }, [closeDialog]);

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
          <div className="flex flex-col gap-4">
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

            {variables.length > 0 && (
              <div>
                <div className="flex flex-col gap-2">
                  {variables.map((variable, index) => (
                    <div className="grid grid-cols-12 items-start gap-4" key={index}>
                      <div className="col-span-5 flex flex-col gap-2">
                        <Label htmlFor={`key-${index}`}>Key</Label>
                        <Input
                          id={`key-${index}`}
                          value={variable.key}
                          onChange={(e) => handleKeyChange(index, e.target.value)}
                          placeholder="e.g. BUILD_TYPE"
                        />
                      </div>
                      <div className="col-span-6 flex flex-col gap-2">
                        <Label htmlFor={`value-${index}`}>Value</Label>
                        <Input
                          id={`value-${index}`}
                          value={variable.value}
                          onChange={(e) => handleValueChange(index, e.target.value)}
                          placeholder="e.g. release"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVariable(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-7"
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
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" onClick={handleClose} variant="ghost" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant="default" disabled={isLoading} onClick={onFormSubmit}>
            {isLoading ? <LoaderCircle size={20} /> : <Play size={20} />}
            {isLoading ? "Triggering..." : "Trigger Pipeline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

GitLabBuildWithParamsDialog.displayName = DIALOG_NAME;
