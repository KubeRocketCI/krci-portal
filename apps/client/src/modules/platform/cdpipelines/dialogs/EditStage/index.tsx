import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import React from "react";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useStageWatchItem } from "@/k8s/api/groups/KRCI/Stage";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { FormContent } from "./components/FormContent";
import { FormActions } from "./components/FormActions";
import { EditStageDialogProps } from "./types";
import { dialogName } from "./constants";

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
  const defaultValues = useDefaultValues(stage);

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
          <FormContextProvider
            formSettings={{
              mode: "onBlur",
              defaultValues,
            }}
          >
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
              <FormActions stage={stage} closeDialog={closeDialog} />
            </DialogFooter>
          </FormContextProvider>
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditStageDialog.displayName = dialogName;
