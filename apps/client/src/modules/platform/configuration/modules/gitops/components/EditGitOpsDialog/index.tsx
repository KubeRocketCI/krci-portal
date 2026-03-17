import { Dialog } from "@/core/components/ui/dialog";

import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../EditGitOpsForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { EditGitOpsForm } from "../EditGitOpsForm";
import type { Codebase } from "@my-project/shared";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

interface EditGitOpsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  codebase: Codebase;
}

export function EditGitOpsDialog({ isOpen, onClose, codebase }: EditGitOpsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={EMPTY_STEPS}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.GIT_OPS.url}
      >
        <FormGuideDialogContent>
          <EditGitOpsForm codebase={codebase} onClose={onClose} />
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
}
