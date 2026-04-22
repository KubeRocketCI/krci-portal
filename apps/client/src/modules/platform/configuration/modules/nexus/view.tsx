import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { CreateNexusForm } from "./components/CreateNexusForm";
import { NexusCard } from "./components/NexusCard";
import { EditNexusDialog } from "./components/EditNexusDialog";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { FORM_GUIDE_CONFIG } from "./components/CreateNexusForm/constants";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";

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

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);
  const handleOpenEditDialog = () => setEditDialogOpen(true);
  const handleCloseEditDialog = () => setEditDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const nexusSecretError = nexusSecretWatch.query.error && getForbiddenError(nexusSecretWatch.query.error);
    const nexusQuickLinkError = nexusQuickLinkWatch.query.error && getForbiddenError(nexusQuickLinkWatch.query.error);
    const isLoading = nexusSecretWatch.query.isLoading || nexusQuickLinkWatch.query.isLoading;

    if (nexusSecretError || nexusQuickLinkError) {
      return <ErrorContent error={nexusSecretError || nexusQuickLinkError} outlined />;
    }

    if (!nexusSecret && !isLoading && !nexusSecretError && !nexusQuickLinkError) {
      const hasPermission = secretPermissions.data.create.allowed && quickLinkPermissions.data.update.allowed;
      const permissionReason = secretPermissions.data.create.reason || quickLinkPermissions.data.update.reason;

      if (!hasPermission) {
        return <EmptyList customText={"No Nexus integration secrets found."} beforeLinkText={permissionReason} />;
      }

      return (
        <EmptyList
          customText={"No Nexus integration secrets found."}
          linkText={"Click here to add integration."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    if (nexusSecret) {
      const ownerReference = nexusSecret.metadata?.ownerReferences?.[0]?.kind;

      return (
        <>
          <NexusCard
            secret={nexusSecret}
            quickLink={nexusQuickLink}
            ownerReference={ownerReference}
            onEdit={handleOpenEditDialog}
          />
          <EditNexusDialog
            isOpen={isEditDialogOpen}
            onClose={handleCloseEditDialog}
            secret={nexusSecret}
            quickLink={nexusQuickLink}
            ownerReference={ownerReference}
          />
        </>
      );
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    nexusSecretWatch.query.error,
    nexusSecretWatch.query.isLoading,
    nexusQuickLinkWatch.query.error,
    nexusQuickLinkWatch.query.isLoading,
    nexusSecret,
    nexusQuickLink,
    isEditDialogOpen,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: <CreateNexusForm quickLink={nexusQuickLink} onClose={handleCloseCreateDialog} />,
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: nexusSecretWatch.query.isLoading || !!nexusSecret,
        permission: {
          allowed: secretPermissions.data.create.allowed && quickLinkPermissions.data.update.allowed,
          reason: secretPermissions.data.create.reason || quickLinkPermissions.data.update.reason,
        },
      }}
      pageDescription={pageDescription}
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_OPERATOR_GUIDE.NEXUS.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
