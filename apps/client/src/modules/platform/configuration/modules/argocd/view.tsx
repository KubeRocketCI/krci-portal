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
import { ManageArgoCD } from "./components/ManageArgoCD";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";

export default function ArgocdConfigurationPage() {
  const argoCDSecretWatch = useSecretWatchItem({
    name: integrationSecretName.ARGO_CD,
  });
  const argoCDSecret = argoCDSecretWatch.query.data;

  const argoCDQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink.argocd,
  });
  const argoCDQuickLink = argoCDQuickLinkWatch.query.data;

  const secretPermissions = useSecretPermissions();
  const quickLinkPermissions = useQuickLinkPermissions();

  const mode = argoCDSecret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const argoCDSecretError = argoCDSecretWatch.query.error && getForbiddenError(argoCDSecretWatch.query.error);
    const argoCDQuickLinkError =
      argoCDQuickLinkWatch.query.error && getForbiddenError(argoCDQuickLinkWatch.query.error);
    const isLoading = argoCDSecretWatch.query.isLoading || argoCDQuickLinkWatch.query.isLoading;

    if (argoCDSecretError || argoCDQuickLinkError) {
      return <ErrorContent error={argoCDSecretError || argoCDQuickLinkError} outlined />;
    }

    if (!argoCDSecret && !isLoading && !argoCDSecretError && !argoCDQuickLinkError) {
      return (
        <>
          <EmptyList
            customText={"No Argo CD integration secrets found."}
            linkText={"Click here to add integration."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const ownerReference = argoCDSecret?.metadata?.ownerReferences?.[0]?.kind;

    const status = getIntegrationSecretStatus(argoCDSecret!);
    const statusIcon = getIntegrationSecretStatusIcon(argoCDSecret!);

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
                <Grid item>{argoCDSecret?.metadata.name}</Grid>
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
            <ManageArgoCD
              secret={argoCDSecret}
              quickLink={argoCDQuickLink}
              mode={mode}
              ownerReference={ownerReference}
              handleClosePanel={handleCloseCreateDialog}
            />
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    argoCDSecretWatch.query.error,
    argoCDSecretWatch.query.isLoading,
    argoCDQuickLinkWatch.query.error,
    argoCDQuickLinkWatch.query.isLoading,
    argoCDSecret,
    argoCDQuickLink,
    mode,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <ManageArgoCD
            secret={argoCDSecret}
            quickLink={argoCDQuickLink}
            mode={mode}
            ownerReference={undefined}
            handleClosePanel={handleCloseCreateDialog}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: argoCDSecretWatch.query.isLoading || !!argoCDSecret,
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
