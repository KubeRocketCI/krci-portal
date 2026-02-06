import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { ManageSonar } from "./components/ManageSonar";
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
      const hasPermission = secretPermissions.data.create.allowed && quickLinkPermissions.data.patch.allowed;
      const permissionReason = secretPermissions.data.create.reason || quickLinkPermissions.data.patch.reason;

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

    const ownerReference = sonarSecret?.metadata?.ownerReferences?.[0]?.kind;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <ManageSonar
          secret={sonarSecret}
          quickLink={sonarQuickLink}
          mode={mode}
          ownerReference={ownerReference}
          handleClosePanel={handleCloseCreateDialog}
        />
      </LoadingWrapper>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
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
