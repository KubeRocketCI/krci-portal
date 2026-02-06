import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { ManageArgoCD } from "./components/ManageArgoCD";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";

export default function ArgocdConfigurationPage() {
  const argoCDSecretWatch = useSecretWatchItem({
    name: integrationSecretName.ARGO_CD,
  });
  const argoCDSecret = argoCDSecretWatch.query.data;

  const argoCDQuickLinkWatch = useQuickLinkWatchItem({
    name: systemQuickLink.argocd,
  });
  const argoCDQuickLink = argoCDQuickLinkWatch.query.data;

  const secretPermissions = useSecretPermissions();
  const quickLinkPermissions = useQuickLinkPermissions();

  const mode = argoCDSecret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const argoCDSecretError = argoCDSecretWatch.query.error && getForbiddenError(argoCDSecretWatch.query.error);
    const argoCDQuickLinkError =
      argoCDQuickLinkWatch.query.error && getForbiddenError(argoCDQuickLinkWatch.query.error);
    const isLoading = argoCDSecretWatch.query.isLoading || argoCDQuickLinkWatch.query.isLoading;

    if (argoCDSecretError || argoCDQuickLinkError) {
      return <ErrorContent error={argoCDSecretError || argoCDQuickLinkError} outlined />;
    }

    if (!argoCDSecret && !isLoading && !argoCDSecretError && !argoCDQuickLinkError) {
      const hasPermission = secretPermissions.data.create.allowed && quickLinkPermissions.data.patch.allowed;
      const permissionReason = secretPermissions.data.create.reason || quickLinkPermissions.data.patch.reason;

      if (!hasPermission) {
        return <EmptyList customText={"No Argo CD integration secrets found."} beforeLinkText={permissionReason} />;
      }

      return (
        <EmptyList
          customText={"No Argo CD integration secrets found."}
          linkText={"Click here to add integration."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    const ownerReference = argoCDSecret?.metadata?.ownerReferences?.[0]?.kind;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <ManageArgoCD
          secret={argoCDSecret}
          quickLink={argoCDQuickLink}
          mode={mode}
          ownerReference={ownerReference}
          handleClosePanel={handleCloseCreateDialog}
        />
      </LoadingWrapper>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    argoCDSecretWatch.query.error,
    argoCDSecretWatch.query.isLoading,
    argoCDQuickLinkWatch.query.error,
    argoCDQuickLinkWatch.query.isLoading,
    argoCDSecret,
    argoCDQuickLink,
    mode,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <ManageArgoCD
            secret={argoCDSecret}
            quickLink={argoCDQuickLink}
            mode={mode}
            ownerReference={undefined}
            handleClosePanel={handleCloseCreateDialog}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: argoCDSecretWatch.query.isLoading || !!argoCDSecret,
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
