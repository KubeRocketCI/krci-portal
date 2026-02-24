import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../EditCDPipelineForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
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
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={[]}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.anchors.EDIT.url}
      >
        <FormGuideDialogContent baseMaxWidth="max-w-6xl" expandedMaxWidth="max-w-7xl">
          <LoadingWrapper isLoading={cdPipelineWatch.query.isLoading}>
            <EditCDPipelineForm cdPipeline={cdPipeline} onClose={closeDialog} />
          </LoadingWrapper>
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
};

EditCDPipelineDialog.displayName = dialogName;
