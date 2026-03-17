import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { CreateDependencyTrackForm } from "./components/CreateDependencyTrackForm";
import { DependencyTrackCard } from "./components/DependencyTrackCard";
import { EditDependencyTrackDialog } from "./components/EditDependencyTrackDialog";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { FORM_GUIDE_CONFIG } from "./components/CreateDependencyTrackForm/constants";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";

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

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);
  const handleOpenEditDialog = () => setEditDialogOpen(true);
  const handleCloseEditDialog = () => setEditDialogOpen(false);

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
      const hasPermission = secretPermissions.data.create.allowed && quickLinkPermissions.data.patch.allowed;
      const permissionReason = secretPermissions.data.create.reason || quickLinkPermissions.data.patch.reason;

      if (!hasPermission) {
        return (
          <EmptyList customText={"No DependencyTrack integration secrets found."} beforeLinkText={permissionReason} />
        );
      }

      return (
        <EmptyList
          customText={"No DependencyTrack integration secrets found."}
          linkText={"Click here to add integration."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    if (dependencyTrackSecret) {
      const ownerReference = dependencyTrackSecret.metadata?.ownerReferences?.[0]?.kind;

      return (
        <>
          <DependencyTrackCard
            secret={dependencyTrackSecret}
            quickLink={dependencyTrackQuickLink}
            ownerReference={ownerReference}
            onEdit={handleOpenEditDialog}
          />
          <EditDependencyTrackDialog
            isOpen={isEditDialogOpen}
            onClose={handleCloseEditDialog}
            secret={dependencyTrackSecret}
            quickLink={dependencyTrackQuickLink}
            ownerReference={ownerReference}
          />
        </>
      );
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    dependencyTrackSecretWatch.query.error,
    dependencyTrackSecretWatch.query.isLoading,
    dependencyTrackQuickLinkWatch.query.error,
    dependencyTrackQuickLinkWatch.query.isLoading,
    dependencyTrackSecret,
    dependencyTrackQuickLink,
    isEditDialogOpen,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: <CreateDependencyTrackForm quickLink={dependencyTrackQuickLink} onClose={handleCloseCreateDialog} />,
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
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_OPERATOR_GUIDE.DEPENDENCY_TRACK.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
