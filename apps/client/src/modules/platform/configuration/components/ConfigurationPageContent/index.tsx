import { Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
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
            <Stack spacing={1} direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                {description} {docLink && <LearnMoreLink url={docLink} />}
              </Box>
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
            </Stack>
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
            <Stack
              direction="row"
              spacing={2}
              justifyContent="space-between"
              alignItems="center"
              sx={{ width: "100%" }}
            >
              <Typography variant="h6">{creationForm.label}</Typography>
              <IconButton onClick={creationForm.onClose}>
                <X size={20} />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>{creationForm.component}</DialogContent>
        </Dialog>
      )}
    </>
  );
};
