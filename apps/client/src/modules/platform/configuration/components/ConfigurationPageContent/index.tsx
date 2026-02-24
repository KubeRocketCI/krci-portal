import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { ConfigurationPageContentProps } from "./types";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Plus } from "lucide-react";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";

export const ConfigurationPageContent = ({
  creationForm,
  children,
  pageDescription,
}: ConfigurationPageContentProps) => {
  const { label, description, docLink, icon } = pageDescription;

  return (
    <>
      <PageWrapper breadcrumbs={[{ label }]} headerSlot={docLink ? <LearnMoreLink url={docLink} /> : undefined}>
        <Section
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
              </div>
            </DialogHeader>
            <DialogBody>{creationForm.component}</DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
