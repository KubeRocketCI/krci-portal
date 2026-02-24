import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useStageWatchItem } from "@/k8s/api/groups/KRCI/Stage";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../EditStageForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
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
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={[]}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.CD_PIPELINE_MANAGE.anchors.EDIT_STAGE.url}
      >
        <FormGuideDialogContent>
          <LoadingWrapper isLoading={stageWatch.query.isLoading}>
            <EditStageForm stage={stage} onClose={closeDialog} />
          </LoadingWrapper>
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
};

EditStageDialog.displayName = dialogName;
