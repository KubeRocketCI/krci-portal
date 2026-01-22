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
import { useCDPipelineCRUD, useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { editCDPipelineObject } from "@my-project/shared";
import { FormContent } from "./components/FormContent";
import { FormActions } from "./components/FormActions";
import { dialogName } from "./constants";
import type { EditCDPipelineDialogProps, EditCDPipelineFormValues } from "./types";
import { EditCDPipelineFormProvider } from "./providers/form/provider";
import { EditCDPipelineDataProvider } from "./providers/data/provider";
import { showToast } from "@/core/components/Snackbar";

export const EditCDPipelineDialog: React.FC<EditCDPipelineDialogProps> = ({ props, state }) => {
  const { CDPipeline: CDPipelineProp } = props;
  const { open, closeDialog } = state;

  const { defaultNamespace } = useClusterStore(useShallow((state) => ({ defaultNamespace: state.defaultNamespace })));

  const cdPipelineWatch = useCDPipelineWatchItem({
    name: CDPipelineProp.metadata.name,
    namespace: CDPipelineProp.metadata.namespace || defaultNamespace,
    queryOptions: {
      enabled: !!CDPipelineProp.metadata.name && !!(CDPipelineProp.metadata.namespace || defaultNamespace),
    },
  });

  const cdPipeline = cdPipelineWatch.query.data || CDPipelineProp;

  const { triggerEditCDPipeline } = useCDPipelineCRUD();

  // Submit handler defined at the top level, passed to form provider
  const handleSubmit = React.useCallback(
    async (values: EditCDPipelineFormValues) => {
      if (!cdPipeline) return;

      const updatedCDPipeline = editCDPipelineObject(cdPipeline, {
        description: values.description,
        applications: values.applications,
        inputDockerStreams: values.inputDockerStreams,
        applicationsToPromote: values.applicationsToPromote,
      });

      await triggerEditCDPipeline({
        data: { cdPipeline: updatedCDPipeline },
        callbacks: { onSuccess: () => closeDialog() },
      });
    },
    [cdPipeline, triggerEditCDPipeline, closeDialog]
  );

  const onSubmitError = React.useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast("Failed to update deployment flow", "error", {
      description: errorMessage,
      duration: 10000,
    });
  }, []);

  if (cdPipelineWatch.query.error) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
        <DialogContent className="w-full max-w-6xl">
          <ErrorContent error={cdPipelineWatch.query.error} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="w-full max-w-6xl">
        <LoadingWrapper isLoading={cdPipelineWatch.query.isLoading}>
          <EditCDPipelineDataProvider cdPipeline={cdPipeline}>
            <EditCDPipelineFormProvider cdPipeline={cdPipeline} onSubmit={handleSubmit} onSubmitError={onSubmitError}>
              <DialogHeader>
                <div className="flex flex-row items-start justify-between gap-2">
                  <div className="flex flex-col gap-4">
                    <DialogTitle>{`Edit ${cdPipeline?.metadata.name}`}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <DialogBody>
                <FormContent />
              </DialogBody>
              <DialogFooter>
                <FormActions />
              </DialogFooter>
            </EditCDPipelineFormProvider>
          </EditCDPipelineDataProvider>
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditCDPipelineDialog.displayName = dialogName;
