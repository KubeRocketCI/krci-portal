import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { ManageNexus } from "./components/ManageNexus";
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
      const hasPermission = secretPermissions.data.create.allowed && quickLinkPermissions.data.patch.allowed;
      const permissionReason = secretPermissions.data.create.reason || quickLinkPermissions.data.patch.reason;

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

    const ownerReference = nexusSecret?.metadata?.ownerReferences?.[0]?.kind;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <ManageNexus
          secret={nexusSecret}
          quickLink={nexusQuickLink}
          mode={mode}
          ownerReference={ownerReference}
          handleClosePanel={handleCloseCreateDialog}
        />
      </LoadingWrapper>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
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
