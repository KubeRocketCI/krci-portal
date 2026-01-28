import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useStageWatchItem } from "@/k8s/api/groups/KRCI/Stage";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import type { EditStageDialogProps } from "./types";
import { EditStageForm } from "../EditStageForm";

const dialogName = "EDIT_STAGE";

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
          <EditStageForm stage={stage} onClose={closeDialog} />
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditStageDialog.displayName = dialogName;
