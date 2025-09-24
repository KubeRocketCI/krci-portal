import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionSummary, Typography, AccordionDetails, Grid, Tooltip } from "@mui/material";
import { getIntegrationSecretStatus, integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { ManageNexus } from "./components/ManageNexus";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";

export default function NexusConfigurationPage() {
  const nexusSecretWatch = useSecretWatchItem({
    name: integrationSecretName.NEXUS,
  });
  const nexusSecret = nexusSecretWatch.query.data;

  const nexusQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink.nexus,
  });
  const nexusQuickLink = nexusQuickLinkWatch.query.data;

  const secretPermissions = useSecretPermissions();
  const quickLinkPermissions = useQuickLinkPermissions();

  const mode = nexusSecret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const nexusSecretError = nexusSecretWatch.query.error && getForbiddenError(nexusSecretWatch.query.error);
    const nexusQuickLinkError = nexusQuickLinkWatch.query.error && getForbiddenError(nexusQuickLinkWatch.query.error);
    const isLoading = nexusSecretWatch.query.isLoading || nexusQuickLinkWatch.query.isLoading;

    if (nexusSecretError || nexusQuickLinkError) {
      return <ErrorContent error={nexusSecretError || nexusQuickLinkError} outlined />;
    }

    if (!nexusSecret && !isLoading && !nexusSecretError && !nexusQuickLinkError) {
      return (
        <>
          <EmptyList
            customText={"No Nexus integration secrets found."}
            linkText={"Click here to add integration."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const ownerReference = nexusSecret?.metadata?.ownerReferences?.[0]?.kind;

    const status = getIntegrationSecretStatus(nexusSecret!);
    const statusIcon = getIntegrationSecretStatusIcon(nexusSecret!);

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion expanded>
          <AccordionSummary style={{ cursor: "default" }}>
            <Typography variant={"h6"}>
              <Grid container spacing={1} alignItems={"center"}>
                <Grid item sx={{ mr: (t) => t.typography.pxToRem(5) }}>
                  <StatusIcon
                    Icon={statusIcon.component}
                    color={statusIcon.color}
                    Title={
                      <>
                        <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                          {`Connected: ${status.connected === undefined ? "Unknown" : status.connected}`}
                        </Typography>
                        {!!status.statusError && (
                          <Typography variant={"subtitle2"} sx={{ mt: (t) => t.typography.pxToRem(10) }}>
                            {status.statusError}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </Grid>
                <Grid item>{nexusSecret?.metadata.name}</Grid>
                {!!ownerReference && (
                  <Grid item>
                    <Tooltip title={`Managed by ${ownerReference}`}>
                      <ShieldX size={20} />
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ManageNexus
              secret={nexusSecret}
              quickLink={nexusQuickLink}
              mode={mode}
              ownerReference={ownerReference}
              handleClosePanel={handleCloseCreateDialog}
            />
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    nexusSecretWatch.query.error,
    nexusSecretWatch.query.isLoading,
    nexusQuickLinkWatch.query.error,
    nexusQuickLinkWatch.query.isLoading,
    nexusSecret,
    nexusQuickLink,
    mode,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <ManageNexus
            secret={nexusSecret}
            quickLink={nexusQuickLink}
            mode={mode}
            ownerReference={undefined}
            handleClosePanel={handleCloseCreateDialog}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: nexusSecretWatch.query.isLoading || !!nexusSecret,
        permission: {
          allowed: secretPermissions.data.create.allowed && quickLinkPermissions.data.patch.allowed,
          reason: secretPermissions.data.create.reason || quickLinkPermissions.data.patch.reason,
        },
      }}
      pageDescription={pageDescription}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
