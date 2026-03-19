import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/core/components/ui/dialog";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent, FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../../constants/form-guide";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { EditRegistryForm, EditRegistryFormProviderWrapper, EditRegistryFormActions } from "../EditRegistryForm";
import { ConfigMap, Secret, ServiceAccount } from "@my-project/shared";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

interface EditRegistryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  EDPConfigMap: ConfigMap;
  pushAccountSecret: Secret | undefined;
  pullAccountSecret: Secret | undefined;
  tektonServiceAccount: ServiceAccount | undefined;
}

export function EditRegistryDialog({
  isOpen,
  onClose,
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
}: EditRegistryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={EMPTY_STEPS}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.REGISTRY.url}
      >
        <FormGuideDialogContent>
          {isOpen && (
            <EditRegistryFormProviderWrapper
              EDPConfigMap={EDPConfigMap}
              pushAccountSecret={pushAccountSecret}
              pullAccountSecret={pullAccountSecret}
              tektonServiceAccount={tektonServiceAccount}
              onClose={onClose}
            >
              <DialogHeader>
                <div className="flex flex-row items-start justify-between gap-2">
                  <div className="flex flex-col gap-4">
                    <DialogTitle className="text-xl font-medium">Edit Container Registry Integration</DialogTitle>
                  </div>
                  <FormGuideToggleButton />
                </div>
              </DialogHeader>
              <DialogBody className="flex min-h-0">
                <div className="flex min-h-0 flex-1 gap-4">
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                      <EditRegistryForm
                        EDPConfigMap={EDPConfigMap}
                        pushAccountSecret={pushAccountSecret}
                        pullAccountSecret={pullAccountSecret}
                        tektonServiceAccount={tektonServiceAccount}
                        onClose={onClose}
                      />
                    </div>
                  </div>
                  <FormGuidePanel />
                </div>
              </DialogBody>
              <DialogFooter>
                <EditRegistryFormActions onClose={onClose} />
              </DialogFooter>
            </EditRegistryFormProviderWrapper>
          )}
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
}
