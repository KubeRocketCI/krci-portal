import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useQuickLinkPermissions, useQuickLinkWatchItem } from "@/k8s/api/groups/KRCI/QuickLink";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName, systemQuickLink } from "@my-project/shared";
import React from "react";
import { CreateArgoCDForm } from "./components/CreateArgoCDForm";
import { ArgoCDCard } from "./components/ArgoCDCard";
import { EditArgoCDDialog } from "./components/EditArgoCDDialog";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { FORM_GUIDE_CONFIG } from "./components/CreateArgoCDForm/constants";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";

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

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);
  const handleOpenEditDialog = () => setEditDialogOpen(true);
  const handleCloseEditDialog = () => setEditDialogOpen(false);

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

    if (argoCDSecret) {
      const ownerReference = argoCDSecret.metadata?.ownerReferences?.[0]?.kind;

      return (
        <>
          <ArgoCDCard
            secret={argoCDSecret}
            quickLink={argoCDQuickLink}
            ownerReference={ownerReference}
            onEdit={handleOpenEditDialog}
          />
          <EditArgoCDDialog
            isOpen={isEditDialogOpen}
            onClose={handleCloseEditDialog}
            secret={argoCDSecret}
            quickLink={argoCDQuickLink}
            ownerReference={ownerReference}
          />
        </>
      );
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    argoCDSecretWatch.query.error,
    argoCDSecretWatch.query.isLoading,
    argoCDQuickLinkWatch.query.error,
    argoCDQuickLinkWatch.query.isLoading,
    argoCDSecret,
    argoCDQuickLink,
    isEditDialogOpen,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: <CreateArgoCDForm quickLink={argoCDQuickLink} onClose={handleCloseCreateDialog} />,
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
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_OPERATOR_GUIDE.ARGO_CD.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
