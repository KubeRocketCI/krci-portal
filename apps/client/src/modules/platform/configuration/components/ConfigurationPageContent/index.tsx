import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { ConfigurationPageContentProps } from "./types";
import { PageWrapper } from "@/core/components/PageWrapper";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Plus, X } from "lucide-react";

export const ConfigurationPageContent = ({
  creationForm,
  children,
  pageDescription,
}: ConfigurationPageContentProps) => {
  const theme = useTheme();

  const { label, description, docLink } = pageDescription;

  return (
    <>
      <PageWrapper containerMaxWidth={"xl"}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography fontSize={theme.typography.pxToRem(28)} color="primary.dark" gutterBottom>
              {label}
            </Typography>
            {description && (
              <Typography variant={"body1"}>
                {description} {docLink && <LearnMoreLink url={docLink} />}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="flex-end">
              <ConditionalWrapper
                condition={!creationForm.permission.allowed}
                wrapper={(children) => (
                  <Tooltip title={creationForm.permission.reason}>
                    <div>{children}</div>
                  </Tooltip>
                )}
              >
                <Button
                  variant="contained"
                  onClick={creationForm.onOpen}
                  disabled={creationForm.isDisabled || !creationForm.permission.allowed}
                  startIcon={<Plus size={20} />}
                >
                  {creationForm.label || "add"}
                </Button>
              </ConditionalWrapper>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            {children}
          </Grid>
        </Grid>
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
