import { Dialog } from "@/core/components/ui/dialog";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../EditDefectDojoForm/constants";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { EditDefectDojoForm } from "../EditDefectDojoForm";
import type { Secret, QuickLink } from "@my-project/shared";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

interface EditDefectDojoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
}

export function EditDefectDojoDialog({
  isOpen,
  onClose,
  secret,
  quickLink,
  ownerReference,
}: EditDefectDojoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={EMPTY_STEPS}
        currentStepIdx={0}
        docUrl={EDP_OPERATOR_GUIDE.DEFECT_DOJO.url}
      >
        <FormGuideDialogContent>
          <EditDefectDojoForm secret={secret} quickLink={quickLink} ownerReference={ownerReference} onClose={onClose} />
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
}
