import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { ConfigurationPageContentProps } from "./types";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Plus, X } from "lucide-react";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";

export const ConfigurationPageContent = ({
  creationForm,
  children,
  pageDescription,
}: ConfigurationPageContentProps) => {
  const { label, description, docLink } = pageDescription;

  return (
    <>
      <PageWrapper breadcrumbs={[{ label }]}>
        <Section
          description={
            <div className="flex items-center justify-between gap-1">
              <div>
                {description} {docLink && <LearnMoreLink url={docLink} />}
              </div>
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
            </div>
          }
        >
          {children}
        </Section>
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
          <DialogContent className="w-full max-w-4xl">
            <DialogHeader>
              <div className="flex w-full items-center justify-between gap-2">
                <DialogTitle>{creationForm.label}</DialogTitle>
                <Button variant="ghost" size="icon" onClick={creationForm.onClose}>
                  <X size={20} />
                </Button>
              </div>
            </DialogHeader>
            <DialogBody>{creationForm.component}</DialogBody>
            <DialogFooter />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
