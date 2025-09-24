import {
  ContainerRegistryType,
  containerRegistryTypeLabelMap,
  krciConfigMapNames,
  registrySecretName,
} from "@my-project/shared";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { ManageRegistry } from "./components/ManageRegistry";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionSummary, Typography, AccordionDetails, Grid } from "@mui/material";
import React from "react";
import { pageDescription } from "../gitops/constants";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useConfigMapWatchList } from "@/k8s/api/groups/Core/ConfigMap";
import { ValueOf } from "@/core/types/global";
import { useServiceAccountWatchItem } from "@/k8s/api/groups/Core/ServiceAccount";

export default function RegistryConfigurationPage() {
  const configMapListWatch = useConfigMapWatchList();

  const configMapList = configMapListWatch.dataArray;

  const krciConfigMap = configMapList.find((configMap) =>
    Object.values(krciConfigMapNames).includes(configMap.metadata.name as ValueOf<typeof krciConfigMapNames>)
  );

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
    configMapListWatch.query.error ||
    pullAccountSecretWatch.query.error ||
    pushAccountSecretWatch.query.error ||
    tektonServiceAccountWatch.query.error;

  const isLoading =
    !configMapListWatch.isReady ||
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
