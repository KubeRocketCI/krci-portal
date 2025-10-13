import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useServiceAccountWatchItem } from "@/k8s/api/groups/Core/ServiceAccount";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionDetails, AccordionSummary, Grid, Typography } from "@mui/material";
import { ContainerRegistryType, containerRegistryTypeLabelMap, registrySecretName } from "@my-project/shared";
import React from "react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "../gitops/constants";
import { ManageRegistry } from "./components/ManageRegistry";

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
    !pullAccountSecretWatch.isReady ||
    !pushAccountSecretWatch.isReady ||
    !tektonServiceAccountWatch.isReady;

  const registryType = krciConfigMap?.data?.container_registry_type;

  const secretPermissions = useSecretPermissions();

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const forbiddenError = error && getForbiddenError(error);

    if (forbiddenError) {
      return <ErrorContent error={forbiddenError} outlined />;
    }

    if (!registryType && !isLoading && !error) {
      return (
        <>
          <EmptyList
            customText={"No registry integration found."}
            linkText={"Click here to add integration."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion expanded>
          <AccordionSummary style={{ cursor: "default" }}>
            <Typography variant={"h6"}>
              {containerRegistryTypeLabelMap[registryType as ContainerRegistryType]}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <ManageRegistry
                  EDPConfigMap={krciConfigMap!}
                  pullAccountSecret={pullAccountSecretWatch.query.data!}
                  pushAccountSecret={pushAccountSecretWatch.query.data!}
                  tektonServiceAccount={tektonServiceAccountWatch.query.data!}
                  handleCloseCreateDialog={handleCloseCreateDialog}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    error,
    isLoading,
    krciConfigMap,
    pullAccountSecretWatch.query.data,
    pushAccountSecretWatch.query.data,
    registryType,
    tektonServiceAccountWatch.query.data,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add registry",
        component: (
          <ManageRegistry
            EDPConfigMap={krciConfigMap!}
            pullAccountSecret={pullAccountSecretWatch.query.data!}
            pushAccountSecret={pushAccountSecretWatch.query.data!}
            tektonServiceAccount={tektonServiceAccountWatch.query.data!}
            handleCloseCreateDialog={handleCloseCreateDialog}
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
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
