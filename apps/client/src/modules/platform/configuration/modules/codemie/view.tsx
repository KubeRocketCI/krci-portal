import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { ManageCodeMie } from "./components/ManageCodeMie";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import React from "react";
import { pageDescription } from "./constants";
import { Grid } from "@mui/material";
import { CodemieApplications } from "./components/Applications";
import { CodemieSection } from "./components/Codemie";
import { CodemieProjectSettingsSection } from "./components/CodemieProjectSettings";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import { useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { useCodemieWatchItem } from "@/k8s/api/groups/KRCI/Codemie";

export default function CodemieConfigurationPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const secretPermissions = useSecretPermissions();

  const codemieQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink.codemie,
  });
  const codemieQuickLink = codemieQuickLinkWatch.query.data;

  const codemieSecretWatch = useSecretWatchItem({
    name: integrationSecretName.CODEMIE,
  });
  const codemieSecret = codemieSecretWatch.query.data;

  const codemieWatch = useCodemieWatchItem({
    name: "codemie",
  });
  const codemie = codemieWatch.query.data;

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <LoadingWrapper
            isLoading={!codemieQuickLinkWatch.isReady || !codemieSecretWatch.isReady || !codemieWatch.isReady}
          >
            <ManageCodeMie
              quickLink={codemieQuickLink}
              codemie={codemie!}
              codemieSecret={codemieSecret!}
              handleClosePanel={handleCloseCreateDialog}
            />
          </LoadingWrapper>
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: true,
        permission: {
          allowed: secretPermissions.data.create.allowed,
          reason: secretPermissions.data.create.reason,
        },
      }}
      pageDescription={pageDescription}
    >
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <CodemieSection
            handleOpenCreateDialog={handleOpenCreateDialog}
            handleCloseCreateDialog={handleCloseCreateDialog}
          />
        </Grid>
        <Grid item xs={12}>
          <CodemieProjectSettingsSection />
        </Grid>
        <Grid item xs={12} sx={{ pb: (t) => t.typography.pxToRem(40) }}>
          <CodemieApplications />
        </Grid>
      </Grid>
    </ConfigurationPageContent>
  );
}
