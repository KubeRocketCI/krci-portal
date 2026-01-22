import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useStageCRUD, useStageWatchItem } from "@/k8s/api/groups/KRCI/Stage";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { editStageObject } from "@my-project/shared";
import { FormContent } from "./components/FormContent";
import { FormActions } from "./components/FormActions";
import { dialogName } from "./constants";
import type { EditStageDialogProps, EditStageFormValues } from "./types";
import { EditStageFormProvider } from "./providers/form/provider";
import { EditStageDataProvider } from "./providers/data/provider";
import { showToast } from "@/core/components/Snackbar";

export const EditStageDialog: React.FC<EditStageDialogProps> = ({ props, state }) => {
  const { stage: stageProp } = props;
  const { open, closeDialog } = state;

  const { defaultNamespace } = useClusterStore(useShallow((state) => ({ defaultNamespace: state.defaultNamespace })));

  const stageWatch = useStageWatchItem({
    name: stageProp.metadata.name,
    namespace: stageProp.metadata.namespace || defaultNamespace,
    queryOptions: {
      enabled: !!stageProp.metadata.name && !!(stageProp.metadata.namespace || defaultNamespace),
    },
  });

  const stage = stageWatch.query.data || stageProp;

  const { triggerEditStage } = useStageCRUD();

  // Submit handler defined at the top level, passed to form provider
  const handleSubmit = React.useCallback(
    async (values: EditStageFormValues) => {
      if (!stage) return;

      const updatedStage = editStageObject(stage, {
        triggerType: values.triggerType as "Auto" | "Manual" | "Auto-stable",
        triggerTemplate: values.triggerTemplate,
        cleanTemplate: values.cleanTemplate,
      });

      await triggerEditStage({
        data: { stage: updatedStage },
        callbacks: { onSuccess: () => closeDialog() },
      });
    },
    [stage, triggerEditStage, closeDialog]
  );

  const onSubmitError = React.useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast("Failed to update environment", "error", {
      description: errorMessage,
      duration: 10000,
    });
  }, []);

  if (stageWatch.query.error) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
        <DialogContent className="w-full max-w-4xl">
          <ErrorContent error={stageWatch.query.error} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="w-full max-w-4xl">
        <LoadingWrapper isLoading={stageWatch.query.isLoading}>
          <EditStageDataProvider stage={stage} closeDialog={closeDialog}>
            <EditStageFormProvider stage={stage} onSubmit={handleSubmit} onSubmitError={onSubmitError}>
              <DialogHeader>
                <div className="flex flex-row items-start justify-between gap-2">
                  <div className="flex flex-col gap-4">
                    <DialogTitle>{`Edit ${stage?.spec?.name || "Environment"}`}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <DialogBody>
                <FormContent />
              </DialogBody>
              <DialogFooter>
                <FormActions />
              </DialogFooter>
            </EditStageFormProvider>
          </EditStageDataProvider>
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditStageDialog.displayName = dialogName;
