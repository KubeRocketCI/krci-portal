import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useServiceAccountWatchItem } from "@/k8s/api/groups/Core/ServiceAccount";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { registrySecretName } from "@my-project/shared";
import React from "react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { CreateRegistryForm } from "./components/CreateRegistryForm";
import { RegistryCard } from "./components/RegistryCard";
import { EditRegistryDialog } from "./components/EditRegistryDialog";
import { FORM_GUIDE_CONFIG } from "./components/ManageRegistry/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { ConfirmResourcesUpdatesDialog } from "@/core/components/dialogs/ConfirmResourcesUpdates";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { useResetRegistry } from "./components/ManageRegistry/hooks/useResetRegistry";

export default function RegistryConfigurationPage() {
  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;

  const pushAccountSecretWatch = useSecretWatchItem({
    name: registrySecretName["kaniko-docker-config"],
  });

  const pullAccountSecretWatch = useSecretWatchItem({
    name: registrySecretName.regcred,
  });

  const tektonServiceAccountWatch = useServiceAccountWatchItem({
    name: "tekton",
  });

  const error =
    krciConfigMapWatch.error ||
    pullAccountSecretWatch.query.error ||
    pushAccountSecretWatch.query.error ||
    tektonServiceAccountWatch.query.error;

  const isLoading =
    krciConfigMapWatch.isLoading ||
    pullAccountSecretWatch.query.isLoading ||
    pushAccountSecretWatch.query.isLoading ||
    tektonServiceAccountWatch.query.isLoading;

  const registryType = krciConfigMap?.data?.container_registry_type;

  const secretPermissions = useSecretPermissions();

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = React.useCallback(() => setCreateDialogOpen(true), []);
  const handleCloseCreateDialog = React.useCallback(() => setCreateDialogOpen(false), []);
  const handleOpenEditDialog = React.useCallback(() => setEditDialogOpen(true), []);
  const handleCloseEditDialog = React.useCallback(() => setEditDialogOpen(false), []);

  const { setDialog } = useDialogContext();

  const { resetRegistry } = useResetRegistry({
    EDPConfigMap: krciConfigMap,
    pushAccountSecret: pushAccountSecretWatch.query.data,
    pullAccountSecret: pullAccountSecretWatch.query.data,
    tektonServiceAccount: tektonServiceAccountWatch.query.data,
  });

  const handleResetRegistry = React.useCallback(() => {
    const someOfTheSecretsHasExternalOwner =
      !!pushAccountSecretWatch.query.data?.metadata?.ownerReferences ||
      !!pullAccountSecretWatch.query.data?.metadata?.ownerReferences;

    if (someOfTheSecretsHasExternalOwner || !secretPermissions.data.delete.allowed) {
      return;
    }

    setDialog(ConfirmResourcesUpdatesDialog, {
      deleteCallback: resetRegistry,
      text: "Are you sure you want to reset the registry?",
      resourcesArray: [],
    });
  }, [
    pushAccountSecretWatch.query.data?.metadata?.ownerReferences,
    pullAccountSecretWatch.query.data?.metadata?.ownerReferences,
    secretPermissions.data.delete.allowed,
    setDialog,
    resetRegistry,
  ]);

  const renderPageContent = React.useCallback(() => {
    const forbiddenError = error && getForbiddenError(error);

    if (forbiddenError) {
      return <ErrorContent error={forbiddenError} outlined />;
    }

    if (!registryType && !isLoading && !error) {
      if (!secretPermissions.data.create.allowed) {
        return (
          <EmptyList
            customText={"No registry integration found."}
            beforeLinkText={secretPermissions.data.create.reason}
          />
        );
      }

      return (
        <EmptyList
          customText={"No registry integration found."}
          linkText={"Click here to add integration."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    if (krciConfigMap && registryType) {
      return (
        <>
          <RegistryCard
            EDPConfigMap={krciConfigMap}
            pushAccountSecret={pushAccountSecretWatch.query.data}
            pullAccountSecret={pullAccountSecretWatch.query.data}
            onEdit={handleOpenEditDialog}
            onReset={handleResetRegistry}
          />
          <EditRegistryDialog
            isOpen={isEditDialogOpen}
            onClose={handleCloseEditDialog}
            EDPConfigMap={krciConfigMap}
            pushAccountSecret={pushAccountSecretWatch.query.data}
            pullAccountSecret={pullAccountSecretWatch.query.data}
            tektonServiceAccount={tektonServiceAccountWatch.query.data}
          />
        </>
      );
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    error,
    isLoading,
    krciConfigMap,
    pullAccountSecretWatch.query.data,
    pushAccountSecretWatch.query.data,
    tektonServiceAccountWatch.query.data,
    registryType,
    isEditDialogOpen,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add registry",
        component: (
          <CreateRegistryForm
            EDPConfigMap={krciConfigMap}
            pullAccountSecret={pullAccountSecretWatch.query.data}
            pushAccountSecret={pushAccountSecretWatch.query.data}
            tektonServiceAccount={tektonServiceAccountWatch.query.data}
            onClose={handleCloseCreateDialog}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: isLoading || !!registryType,
        permission: {
          allowed: secretPermissions.data.create.allowed,
          reason: secretPermissions.data.create.reason,
        },
      }}
      pageDescription={pageDescription}
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_USER_GUIDE.REGISTRY.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
