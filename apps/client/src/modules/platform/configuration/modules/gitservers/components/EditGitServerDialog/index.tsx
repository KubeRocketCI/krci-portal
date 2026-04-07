import React from "react";
import { Dialog } from "@/core/components/ui/dialog";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../EditGitServerForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { EditGitServerForm } from "../EditGitServerForm";
import type { GitServer } from "@my-project/shared";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

interface EditGitServerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gitServer: GitServer;
  webhookURL: string | undefined;
}

export const EditGitServerDialog: React.FC<EditGitServerDialogProps> = ({ isOpen, onClose, gitServer, webhookURL }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={EMPTY_STEPS}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.GIT_SERVER_CREATE.url}
      >
        <FormGuideDialogContent>
          <EditGitServerForm gitServer={gitServer} webhookURL={webhookURL} onClose={onClose} />
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
};
