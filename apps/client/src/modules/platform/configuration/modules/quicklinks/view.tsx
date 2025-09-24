import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { Box, Grid, Stack } from "@mui/material";
import { QuickLinkList } from "./components/QuickLinkList";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ManageQuickLinkDialog } from "./dialogs/ManageQuickLink";
import { Plus } from "lucide-react";
import { useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink/hooks";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";

export default function QuickLinkListPageContent() {
  const openManageQuickLinkDialog = useDialogOpener(ManageQuickLinkDialog);

  const quickLinkPermissions = useQuickLinkPermissions();

  return (
    <PageWrapper breadcrumbs={[{ label: "Overview" }]}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Section
            description={
              <Stack spacing={1} direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  Configure links for quick access to required tools.{" "}
                  <LearnMoreLink url={EDP_USER_GUIDE.QUICK_LINKS.url} />
                </Box>
                <ButtonWithPermission
                  ButtonProps={{
                    startIcon: <Plus size={16} />,
                    color: "primary",
                    variant: "contained",
                    onClick: () => {
                      openManageQuickLinkDialog({ quickLink: undefined });
                    },
                  }}
                  allowed={quickLinkPermissions.data.create.allowed}
                  reason={quickLinkPermissions.data.create.reason}
                >
                  add link
                </ButtonWithPermission>
              </Stack>
            }
          >
            <QuickLinkList />
          </Section>
        </Grid>
      </Grid>
    </PageWrapper>
  );
}
