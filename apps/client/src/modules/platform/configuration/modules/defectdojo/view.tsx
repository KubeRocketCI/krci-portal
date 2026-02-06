import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { ManageDefectDojo } from "./components/ManageDefectDojo";
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
      const hasPermission = secretPermissions.data.create.allowed && quickLinkPermissions.data.patch.allowed;
      const permissionReason = secretPermissions.data.create.reason || quickLinkPermissions.data.patch.reason;

      if (!hasPermission) {
        return <EmptyList customText={"No DefectDojo integration secrets found."} beforeLinkText={permissionReason} />;
      }

      return (
        <EmptyList
          customText={"No DefectDojo integration secrets found."}
          linkText={"Click here to add integration."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    const ownerReference = defectDojoSecret?.metadata?.ownerReferences?.[0]?.kind;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <ManageDefectDojo
          secret={defectDojoSecret}
          quickLink={defectDojoQuickLink}
          mode={mode}
          ownerReference={ownerReference}
          handleClosePanel={handleCloseCreateDialog}
        />
      </LoadingWrapper>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
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
