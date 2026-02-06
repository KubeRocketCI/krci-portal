import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { ManageDependencyTrack } from "./components/ManageDependencyTrack";
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

    const ownerReference = dependencyTrackSecret?.metadata?.ownerReferences?.[0]?.kind;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <ManageDependencyTrack
          secret={dependencyTrackSecret}
          quickLink={dependencyTrackQuickLink}
          mode={mode}
          ownerReference={ownerReference}
          handleClosePanel={handleCloseCreateDialog}
        />
      </LoadingWrapper>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
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
