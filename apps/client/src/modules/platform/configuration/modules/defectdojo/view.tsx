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
import { ManageDefectDojo } from "./components/ManageDefectDojo";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";

export default function DefectdojoConfigurationPage() {
  const defectDojoSecretWatch = useSecretWatchItem({
    name: integrationSecretName.DEFECT_DOJO,
  });
  const defectDojoSecret = defectDojoSecretWatch.query.data;

  const defectDojoQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink.defectdojo,
  });
  const defectDojoQuickLink = defectDojoQuickLinkWatch.query.data;

  const secretPermissions = useSecretPermissions();
  const quickLinkPermissions = useQuickLinkPermissions();

  const mode = defectDojoSecret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const defectDojoSecretError =
      defectDojoSecretWatch.query.error && getForbiddenError(defectDojoSecretWatch.query.error);
    const defectDojoQuickLinkError =
      defectDojoQuickLinkWatch.query.error && getForbiddenError(defectDojoQuickLinkWatch.query.error);
    const isLoading = defectDojoSecretWatch.query.isLoading || defectDojoQuickLinkWatch.query.isLoading;

    if (defectDojoSecretError || defectDojoQuickLinkError) {
      return <ErrorContent error={defectDojoSecretError || defectDojoQuickLinkError} outlined />;
    }

    if (!defectDojoSecret && !isLoading && !defectDojoSecretError && !defectDojoQuickLinkError) {
      return (
        <>
          <EmptyList
            customText={"No DefectDojo integration secrets found."}
            linkText={"Click here to add integration."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const ownerReference = defectDojoSecret?.metadata?.ownerReferences?.[0]?.kind;

    const status = getIntegrationSecretStatus(defectDojoSecret!);
    const statusIcon = getIntegrationSecretStatusIcon(defectDojoSecret!);

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion expanded>
          <AccordionSummary style={{ cursor: "default" }}>
            <h6 className="text-base font-medium">
              <div className="flex items-center gap-2">
                <div className="mr-1">
                  <StatusIcon
                    Icon={statusIcon.component}
                    color={statusIcon.color}
                    Title={
                      <>
                        <p className="text-sm font-semibold">
                          {`Connected: ${status.connected === undefined ? "Unknown" : status.connected}`}
                        </p>
                        {!!status.statusError && <p className="mt-3 text-sm font-medium">{status.statusError}</p>}
                      </>
                    }
                  />
                </div>
                <div>{defectDojoSecret?.metadata.name}</div>
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
            <ManageDefectDojo
              secret={defectDojoSecret}
              quickLink={defectDojoQuickLink}
              mode={mode}
              ownerReference={ownerReference}
              handleClosePanel={handleCloseCreateDialog}
            />
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    defectDojoSecretWatch.query.error,
    defectDojoSecretWatch.query.isLoading,
    defectDojoQuickLinkWatch.query.error,
    defectDojoQuickLinkWatch.query.isLoading,
    defectDojoSecret,
    defectDojoQuickLink,
    mode,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <ManageDefectDojo
            secret={defectDojoSecret}
            quickLink={defectDojoQuickLink}
            mode={mode}
            ownerReference={undefined}
            handleClosePanel={handleCloseCreateDialog}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: defectDojoSecretWatch.query.isLoading || !!defectDojoSecret,
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
