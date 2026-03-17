import { Dialog } from "@/core/components/ui/dialog";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../CreateSonarForm/constants";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { EditSonarForm } from "../EditSonarForm";
import type { Secret, QuickLink } from "@my-project/shared";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

interface EditSonarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
}

export function EditSonarDialog({ isOpen, onClose, secret, quickLink, ownerReference }: EditSonarDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={EMPTY_STEPS}
        currentStepIdx={0}
        docUrl={EDP_OPERATOR_GUIDE.SONAR.url}
      >
        <FormGuideDialogContent>
          <EditSonarForm secret={secret} quickLink={quickLink} ownerReference={ownerReference} onClose={onClose} />
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
}
