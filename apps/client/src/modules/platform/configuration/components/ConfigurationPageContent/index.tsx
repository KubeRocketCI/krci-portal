import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
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
                  startIcon: <Plus size={16} />,
                  color: "primary",
                  variant: "contained",
                  onClick: creationForm.onOpen,
                  disabled: creationForm.isDisabled,
                }}
                allowed={creationForm.permission.allowed}
                reason={creationForm.permission.reason}
              >
                {creationForm.label || "add"}
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
          maxWidth="md"
          fullWidth
          onClose={(_e, reason) => reason !== "backdropClick" && creationForm.onClose()}
        >
          <DialogTitle component="div">
            <div className="flex justify-between items-center w-full gap-2">
              <h2 className="text-xl font-medium">{creationForm.label}</h2>
              <IconButton onClick={creationForm.onClose}>
                <X size={20} />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent>{creationForm.component}</DialogContent>
        </Dialog>
      )}
    </>
  );
};
