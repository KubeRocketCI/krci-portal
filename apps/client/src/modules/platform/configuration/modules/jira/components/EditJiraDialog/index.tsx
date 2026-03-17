import { Dialog } from "@/core/components/ui/dialog";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../CreateJiraForm/constants";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { EditJiraForm } from "../EditJiraForm";
import type { Secret, JiraServer } from "@my-project/shared";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

interface EditJiraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  secret: Secret;
  jiraServer: JiraServer | undefined;
  ownerReference: string | undefined;
}

export function EditJiraDialog({ isOpen, onClose, secret, jiraServer, ownerReference }: EditJiraDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={EMPTY_STEPS}
        currentStepIdx={0}
        docUrl={EDP_OPERATOR_GUIDE.JIRA.url}
      >
        <FormGuideDialogContent>
          <EditJiraForm secret={secret} jiraServer={jiraServer} ownerReference={ownerReference} onClose={onClose} />
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
}
