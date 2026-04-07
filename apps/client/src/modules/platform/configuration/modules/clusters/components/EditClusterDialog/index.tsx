import React from "react";
import { Dialog } from "@/core/components/ui/dialog";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../EditClusterSecretForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { EditClusterSecretForm } from "../EditClusterSecretForm";
import type { Secret } from "@my-project/shared";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

interface EditClusterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clusterSecret: Secret;
  ownerReference: string | undefined;
}

export const EditClusterDialog: React.FC<EditClusterDialogProps> = ({
  isOpen,
  onClose,
  clusterSecret,
  ownerReference,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={EMPTY_STEPS}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.CLUSTER_CREATE.url}
      >
        <FormGuideDialogContent>
          <EditClusterSecretForm secret={clusterSecret} ownerReference={ownerReference} onClose={onClose} />
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
};
