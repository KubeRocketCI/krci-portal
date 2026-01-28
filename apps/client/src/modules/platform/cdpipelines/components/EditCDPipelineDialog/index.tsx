import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import type { EditCDPipelineDialogProps } from "./types";
import { EditCDPipelineForm } from "../EditCDPipelineForm";

const dialogName = "EDIT_CD_PIPELINE_DIALOG";

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
          <EditCDPipelineForm cdPipeline={cdPipeline} onClose={closeDialog} />
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditCDPipelineDialog.displayName = dialogName;
