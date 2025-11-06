import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { Tooltip } from "@/core/components/ui/tooltip";
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
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
              <AccordionTrigger className="cursor-default">
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
                    <div>{nexusSecret?.metadata.name}</div>
                    {!!ownerReference && (
                      <div>
                        <Tooltip title={`Managed by ${ownerReference}`}>
                          <ShieldX size={20} />
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </h6>
              </AccordionTrigger>
              <AccordionContent>
                <ManageNexus
                  secret={nexusSecret}
                  quickLink={nexusQuickLink}
                  mode={mode}
                  ownerReference={ownerReference}
                  handleClosePanel={handleCloseCreateDialog}
                />
              </AccordionContent>
            </AccordionItem>
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
