import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { CreateSonarForm } from "./components/CreateSonarForm";
import { SonarCard } from "./components/SonarCard";
import { EditSonarDialog } from "./components/EditSonarDialog";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { FORM_GUIDE_CONFIG } from "./components/CreateSonarForm/constants";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";

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

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);
  const handleOpenEditDialog = () => setEditDialogOpen(true);
  const handleCloseEditDialog = () => setEditDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const sonarSecretError = sonarSecretWatch.query.error && getForbiddenError(sonarSecretWatch.query.error);
    const sonarQuickLinkError = sonarQuickLinkWatch.query.error && getForbiddenError(sonarQuickLinkWatch.query.error);
    const isLoading = sonarSecretWatch.query.isLoading || sonarQuickLinkWatch.query.isLoading;

    if (sonarSecretError || sonarQuickLinkError) {
      return <ErrorContent error={sonarSecretError || sonarQuickLinkError} outlined />;
    }

    if (!sonarSecret && !isLoading && !sonarSecretError && !sonarQuickLinkError) {
      const hasPermission = secretPermissions.data.create.allowed && quickLinkPermissions.data.update.allowed;
      const permissionReason = secretPermissions.data.create.reason || quickLinkPermissions.data.update.reason;

      if (!hasPermission) {
        return <EmptyList customText={"No SonarQube integration secrets found."} beforeLinkText={permissionReason} />;
      }

      return (
        <EmptyList
          customText={"No SonarQube integration secrets found."}
          linkText={"Click here to add integration."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    if (sonarSecret) {
      const ownerReference = sonarSecret.metadata?.ownerReferences?.[0]?.kind;

      return (
        <>
          <SonarCard
            secret={sonarSecret}
            quickLink={sonarQuickLink}
            ownerReference={ownerReference}
            onEdit={handleOpenEditDialog}
          />
          <EditSonarDialog
            isOpen={isEditDialogOpen}
            onClose={handleCloseEditDialog}
            secret={sonarSecret}
            quickLink={sonarQuickLink}
            ownerReference={ownerReference}
          />
        </>
      );
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    sonarSecretWatch.query.error,
    sonarSecretWatch.query.isLoading,
    sonarQuickLinkWatch.query.error,
    sonarQuickLinkWatch.query.isLoading,
    sonarSecret,
    sonarQuickLink,
    isEditDialogOpen,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: <CreateSonarForm quickLink={sonarQuickLink} onClose={handleCloseCreateDialog} />,
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: sonarSecretWatch.query.isLoading || !!sonarSecret,
        permission: {
          allowed: secretPermissions.data.create.allowed && quickLinkPermissions.data.update.allowed,
          reason: secretPermissions.data.create.reason || quickLinkPermissions.data.update.reason,
        },
      }}
      pageDescription={pageDescription}
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_OPERATOR_GUIDE.SONAR.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
