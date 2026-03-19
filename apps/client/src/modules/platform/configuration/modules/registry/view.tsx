import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useServiceAccountWatchItem } from "@/k8s/api/groups/Core/ServiceAccount";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { registrySecretName } from "@my-project/shared";
import React from "react";
import { pageDescription } from "./constants";
import {
  CreateRegistryForm,
  CreateRegistryFormProviderWrapper,
  CreateRegistryFormActions,
} from "./components/CreateRegistryForm";
import { RegistryCard } from "./components/RegistryCard";
import { EditRegistryDialog } from "./components/EditRegistryDialog";
import { FORM_GUIDE_CONFIG } from "./constants/form-guide";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { ConfirmResourcesUpdatesDialog } from "@/core/components/dialogs/ConfirmResourcesUpdates";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { useResetRegistry } from "./hooks/useResetRegistry";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Plus } from "lucide-react";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { FormGuideDialogContent, FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

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

  const { label, description, icon } = pageDescription;

  return (
    <FormGuideProvider
      config={FORM_GUIDE_CONFIG}
      steps={EMPTY_STEPS}
      currentStepIdx={0}
      docUrl={EDP_USER_GUIDE.REGISTRY.url}
    >
      <PageWrapper breadcrumbs={[{ label }]}>
        <PageContentWrapper
          icon={icon}
          title={label}
          description={description}
          actions={
            <ButtonWithPermission
              ButtonProps={{
                variant: "default",
                onClick: handleOpenCreateDialog,
                disabled: isLoading || !!registryType,
              }}
              allowed={secretPermissions.data.create.allowed}
              reason={secretPermissions.data.create.reason}
            >
              <Plus size={16} />
              Add registry
            </ButtonWithPermission>
          }
        >
          {renderPageContent()}
        </PageContentWrapper>
      </PageWrapper>

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && handleCloseCreateDialog()}>
        <FormGuideDialogContent className="w-full" baseMaxWidth="max-w-4xl" expandedMaxWidth="max-w-6xl">
          {isCreateDialogOpen && (
            <CreateRegistryFormProviderWrapper
              EDPConfigMap={krciConfigMap}
              pullAccountSecret={pullAccountSecretWatch.query.data}
              pushAccountSecret={pushAccountSecretWatch.query.data}
              tektonServiceAccount={tektonServiceAccountWatch.query.data}
              onClose={handleCloseCreateDialog}
            >
              <DialogHeader>
                <div className="flex w-full items-center justify-between gap-2">
                  <DialogTitle>Add registry</DialogTitle>
                  <FormGuideToggleButton />
                </div>
              </DialogHeader>
              <DialogBody className="flex min-h-0">
                <div className="flex min-h-0 flex-1 gap-4">
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                      <CreateRegistryForm
                        EDPConfigMap={krciConfigMap}
                        pullAccountSecret={pullAccountSecretWatch.query.data}
                        pushAccountSecret={pushAccountSecretWatch.query.data}
                        tektonServiceAccount={tektonServiceAccountWatch.query.data}
                        onClose={handleCloseCreateDialog}
                      />
                    </div>
                  </div>
                  <FormGuidePanel />
                </div>
              </DialogBody>
              <DialogFooter>
                <CreateRegistryFormActions onClose={handleCloseCreateDialog} />
              </DialogFooter>
            </CreateRegistryFormProviderWrapper>
          )}
        </FormGuideDialogContent>
      </Dialog>
    </FormGuideProvider>
  );
}
