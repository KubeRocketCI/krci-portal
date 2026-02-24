import { Dialog } from "@/core/components/ui/dialog";
import React from "react";
import { Create } from "./components/Create";
import { Edit } from "./components/Edit";
import { DIALOG_NAME, FORM_GUIDE_CONFIG } from "./constants";
import { CurrentDialogContextProvider } from "./providers/CurrentDialog/provider";
import { ManageQuickLinkDialogProps } from "./types";
import { FORM_MODES } from "@/core/types/forms";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";

export const ManageQuickLinkDialog: React.FC<ManageQuickLinkDialogProps> = (props) => {
  const {
    props: { quickLink },
    state: { open, closeDialog },
  } = props;

  const mode = quickLink ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={[]}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.QUICK_LINKS.url}
      >
        <FormGuideDialogContent>
          <CurrentDialogContextProvider {...props}>
            {mode === FORM_MODES.CREATE ? <Create /> : mode === FORM_MODES.EDIT ? <Edit /> : null}
          </CurrentDialogContextProvider>
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
};

ManageQuickLinkDialog.displayName = DIALOG_NAME;
