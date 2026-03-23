import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { ConfigurationPageContentProps } from "./types";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Plus } from "lucide-react";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { FormGuideDialogContent, FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

export const ConfigurationPageContent = ({
  creationForm,
  children,
  pageDescription,
  formGuideConfig,
  formGuideDocUrl,
}: ConfigurationPageContentProps) => {
  const { label, description, icon } = pageDescription;

  const content = (
    <>
      <PageWrapper breadcrumbs={[{ label }]}>
        <PageContentWrapper
          icon={icon}
          title={label}
          description={description}
          actions={
            <ButtonWithPermission
              ButtonProps={{
                variant: "default",
                onClick: creationForm.onOpen,
                disabled: creationForm.isDisabled,
              }}
              allowed={creationForm.permission.allowed}
              reason={creationForm.permission.reason}
            >
              <Plus size={16} />
              {creationForm.label || "Add"}
            </ButtonWithPermission>
          }
        >
          {children}
        </PageContentWrapper>
      </PageWrapper>
      {creationForm && (
        <Dialog
          open={creationForm.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              creationForm.onClose();
            }
          }}
        >
          <FormGuideDialogContent className="w-full" baseMaxWidth="max-w-4xl" expandedMaxWidth="max-w-6xl">
            <DialogHeader>
              <div className="flex w-full items-center justify-between gap-2">
                <DialogTitle>{creationForm.label}</DialogTitle>
                <FormGuideToggleButton />
              </div>
            </DialogHeader>
            <DialogBody className="flex min-h-0">
              <div className="flex min-h-0 flex-1 gap-4">
                <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
                  {creationForm.isOpen && creationForm.component}
                </div>
                <FormGuidePanel />
              </div>
            </DialogBody>
            {creationForm.actions && <DialogFooter>{creationForm.actions}</DialogFooter>}
          </FormGuideDialogContent>
        </Dialog>
      )}
    </>
  );

  // Wrap with FormGuideProvider if config is provided
  if (formGuideConfig && formGuideDocUrl) {
    return (
      <FormGuideProvider config={formGuideConfig} steps={EMPTY_STEPS} currentStepIdx={0} docUrl={formGuideDocUrl}>
        {content}
      </FormGuideProvider>
    );
  }

  return content;
};
