import { Dialog, DialogContent, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import React from "react";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { FormContent } from "./components/FormContent";
import { FormActions } from "./components/FormActions";
import { EditCDPipelineDialogProps } from "./types";
import { dialogName } from "./constants";

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
  const defaultValues = useDefaultValues(cdPipeline);

  if (cdPipelineWatch.query.error) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
        <DialogContent className="w-full max-w-4xl">
          <ErrorContent error={cdPipelineWatch.query.error} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="w-full max-w-4xl">
        <LoadingWrapper isLoading={cdPipelineWatch.query.isLoading}>
          <FormContextProvider
            formSettings={{
              mode: "onBlur",
              defaultValues,
            }}
          >
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
              <FormActions cdPipeline={cdPipeline} />
            </DialogFooter>
          </FormContextProvider>
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditCDPipelineDialog.displayName = dialogName;

