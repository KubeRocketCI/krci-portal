import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionSummary, AccordionDetails, Tooltip } from "@mui/material";
import { getIntegrationSecretStatus, integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { ManageSonar } from "./components/ManageSonar";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";

export default function SonarConfigurationPage() {
  const sonarSecretWatch = useSecretWatchItem({
    name: integrationSecretName.SONAR,
  });
  const sonarSecret = sonarSecretWatch.query.data;

  const sonarQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink.sonar,
  });
  const sonarQuickLink = sonarQuickLinkWatch.query.data;

  const secretPermissions = useSecretPermissions();
  const quickLinkPermissions = useQuickLinkPermissions();

  const mode = sonarSecret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const sonarSecretError = sonarSecretWatch.query.error && getForbiddenError(sonarSecretWatch.query.error);
    const sonarQuickLinkError = sonarQuickLinkWatch.query.error && getForbiddenError(sonarQuickLinkWatch.query.error);
    const isLoading = sonarSecretWatch.query.isLoading || sonarQuickLinkWatch.query.isLoading;

    if (sonarSecretError || sonarQuickLinkError) {
      return <ErrorContent error={sonarSecretError || sonarQuickLinkError} outlined />;
    }

    if (!sonarSecret && !isLoading && !sonarSecretError && !sonarQuickLinkError) {
      return (
        <>
          <EmptyList
            customText={"No SonarQube integration secrets found."}
            linkText={"Click here to add integration."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const ownerReference = sonarSecret?.metadata?.ownerReferences?.[0]?.kind;

    const status = getIntegrationSecretStatus(sonarSecret!);
    const statusIcon = getIntegrationSecretStatusIcon(sonarSecret!);

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion expanded>
          <AccordionSummary style={{ cursor: "default" }}>
            <h6 className="text-base font-medium">
              <div className="flex gap-2 items-center">
                <div className="mr-1">
                  <StatusIcon
                    Icon={statusIcon.component}
                    color={statusIcon.color}
                    Title={
                      <>
                        <p className="text-sm font-semibold">
                          {`Connected: ${status.connected === undefined ? "Unknown" : status.connected}`}
                        </p>
                        {!!status.statusError && (
                          <p className="text-sm font-medium mt-3">
                            {status.statusError}
                          </p>
                        )}
                      </>
                    }
                  />
                </div>
                <div>{sonarSecret?.metadata.name}</div>
                {!!ownerReference && (
                  <div>
                    <Tooltip title={`Managed by ${ownerReference}`}>
                      <ShieldX size={20} />
                    </Tooltip>
                  </div>
                )}
              </div>
            </h6>
          </AccordionSummary>
          <AccordionDetails>
            <ManageSonar
              secret={sonarSecret}
              quickLink={sonarQuickLink}
              mode={mode}
              ownerReference={ownerReference}
              handleClosePanel={handleCloseCreateDialog}
            />
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    sonarSecretWatch.query.error,
    sonarSecretWatch.query.isLoading,
    sonarQuickLinkWatch.query.error,
    sonarQuickLinkWatch.query.isLoading,
    sonarSecret,
    sonarQuickLink,
    mode,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <ManageSonar
            secret={sonarSecret}
            quickLink={sonarQuickLink}
            mode={mode}
            ownerReference={undefined}
            handleClosePanel={handleCloseCreateDialog}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: sonarSecretWatch.query.isLoading || !!sonarSecret,
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
