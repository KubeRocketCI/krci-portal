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
import { ManageDependencyTrack } from "./components/ManageDependencyTrack";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";

export default function DependencyTrackConfigurationPage() {
  const dependencyTrackSecretWatch = useSecretWatchItem({
    name: integrationSecretName.DEPENDENCY_TRACK,
  });
  const dependencyTrackSecret = dependencyTrackSecretWatch.query.data;

  const dependencyTrackQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink["dependency-track"],
  });
  const dependencyTrackQuickLink = dependencyTrackQuickLinkWatch.query.data;

  const secretPermissions = useSecretPermissions();
  const quickLinkPermissions = useQuickLinkPermissions();

  const mode = dependencyTrackSecret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const dependencyTrackSecretError =
      dependencyTrackSecretWatch.query.error && getForbiddenError(dependencyTrackSecretWatch.query.error);
    const dependencyTrackQuickLinkError =
      dependencyTrackQuickLinkWatch.query.error && getForbiddenError(dependencyTrackQuickLinkWatch.query.error);
    const isLoading = dependencyTrackSecretWatch.query.isLoading || dependencyTrackQuickLinkWatch.query.isLoading;

    if (dependencyTrackSecretError || dependencyTrackQuickLinkError) {
      return <ErrorContent error={dependencyTrackSecretError || dependencyTrackQuickLinkError} outlined />;
    }

    if (!dependencyTrackSecret && !isLoading && !dependencyTrackSecretError && !dependencyTrackQuickLinkError) {
      return (
        <>
          <EmptyList
            customText={"No DependencyTrack integration secrets found."}
            linkText={"Click here to add integration."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const ownerReference = dependencyTrackSecret?.metadata?.ownerReferences?.[0]?.kind;

    const status = getIntegrationSecretStatus(dependencyTrackSecret!);
    const statusIcon = getIntegrationSecretStatusIcon(dependencyTrackSecret!);

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
                <Grid item>{dependencyTrackSecret?.metadata.name}</Grid>
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
            <ManageDependencyTrack
              secret={dependencyTrackSecret}
              quickLink={dependencyTrackQuickLink}
              mode={mode}
              ownerReference={ownerReference}
              handleClosePanel={handleCloseCreateDialog}
            />
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    dependencyTrackSecretWatch.query.error,
    dependencyTrackSecretWatch.query.isLoading,
    dependencyTrackQuickLinkWatch.query.error,
    dependencyTrackQuickLinkWatch.query.isLoading,
    dependencyTrackSecret,
    dependencyTrackQuickLink,
    mode,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <ManageDependencyTrack
            secret={dependencyTrackSecret}
            quickLink={dependencyTrackQuickLink}
            mode={mode}
            ownerReference={undefined}
            handleClosePanel={handleCloseCreateDialog}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: dependencyTrackSecretWatch.query.isLoading || !!dependencyTrackSecret,
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
