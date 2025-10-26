import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useSecretPermissions, useSecretWatchList } from "@/k8s/api/groups/Core/Secret";
import { useApplicationPermissions } from "@/k8s/api/groups/ArgoCD/Application";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionSummary, Typography, AccordionDetails, Grid, Tooltip } from "@mui/material";
import {
  SECRET_LABEL_SECRET_TYPE,
  SECRET_ANNOTATION_CLUSTER_CONNECTED,
  SECRET_ANNOTATION_CLUSTER_ERROR,
} from "@my-project/shared";
import React from "react";
import { ManageClusterSecret } from "./components/ManageClusterSecret";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { ChevronDown } from "lucide-react";
import { FORM_MODES } from "@/core/types/forms";

export default function ClustersConfigurationPage() {
  const clusterSecretsWatch = useSecretWatchList({
    labels: {
      [SECRET_LABEL_SECRET_TYPE]: "cluster",
    },
  });
  const clusterSecrets = clusterSecretsWatch.data.array;

  const secretPermissions = useSecretPermissions();
  const applicationPermissions = useApplicationPermissions();

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [expandedPanel, setExpandedPanel] = React.useState<string | null>(null);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const renderPageContent = React.useCallback(() => {
    const clusterSecretsError = clusterSecretsWatch.query.error && getForbiddenError(clusterSecretsWatch.query.error);
    const isLoading = clusterSecretsWatch.query.isLoading;

    if (clusterSecretsError) {
      return <ErrorContent error={clusterSecretsError} outlined />;
    }

    if (!clusterSecrets?.length && !isLoading && !clusterSecretsError) {
      return (
        <>
          <EmptyList
            customText={"No cluster secrets found."}
            linkText={"Click here to add cluster."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const singleItem = clusterSecrets?.length === 1;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Grid container spacing={1}>
          {clusterSecrets?.map((clusterSecret) => {
            const connected = clusterSecret?.metadata?.annotations?.[SECRET_ANNOTATION_CLUSTER_CONNECTED];
            const error = clusterSecret?.metadata?.annotations?.[SECRET_ANNOTATION_CLUSTER_ERROR];

            // Use the integration secret status icon for cluster secrets
            const statusIcon = getIntegrationSecretStatusIcon(clusterSecret);

            const clusterName = clusterSecret.metadata.name;
            const isExpanded = expandedPanel === clusterName;
            const ownerReference = clusterSecret?.metadata?.ownerReferences?.[0]?.kind;

            return (
              <Grid item xs={12} key={clusterSecret.metadata.uid}>
                <Accordion
                  expanded={singleItem || isExpanded}
                  onChange={singleItem ? undefined : handleChange(clusterName)}
                >
                  <AccordionSummary
                    expandIcon={singleItem ? null : <ChevronDown size={20} />}
                    style={{
                      cursor: singleItem ? "default" : "pointer",
                    }}
                  >
                    <Typography variant={"h6"}>
                      <Grid container spacing={1} alignItems={"center"}>
                        <Grid item sx={{ mr: (t) => t.typography.pxToRem(5) }}>
                          <StatusIcon
                            Icon={statusIcon.component}
                            color={statusIcon.color}
                            Title={
                              <>
                                <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                                  {`Connected: ${connected === undefined ? "Unknown" : connected}`}
                                </Typography>
                                {!!error && (
                                  <Typography variant={"subtitle2"} sx={{ mt: (t) => t.typography.pxToRem(10) }}>
                                    {error}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </Grid>
                        <Grid item>{clusterName}</Grid>
                        {!!ownerReference && (
                          <Grid item>
                            <Tooltip title={`Managed by ${ownerReference}`}>
                              <ShieldX size={20} />
                            </Tooltip>
                          </Grid>
                        )}
                      </Grid>
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(singleItem || isExpanded) && (
                      <ManageClusterSecret
                        formData={{
                          currentElement: clusterSecret,
                          ownerReference: ownerReference,
                          mode: FORM_MODES.EDIT,
                          handleClosePlaceholder: handleCloseCreateDialog,
                        }}
                      />
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>
            );
          })}
        </Grid>
      </LoadingWrapper>
    );
  }, [clusterSecretsWatch.query.error, clusterSecretsWatch.query.isLoading, clusterSecrets, expandedPanel]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Cluster",
        component: (
          <ManageClusterSecret
            formData={{
              currentElement: undefined,
              ownerReference: undefined,
              mode: FORM_MODES.CREATE,
              handleClosePlaceholder: handleCloseCreateDialog,
            }}
          />
        ),
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: clusterSecretsWatch.query.isLoading,
        permission: {
          allowed: secretPermissions.data.create.allowed && applicationPermissions.data.create.allowed,
          reason: secretPermissions.data.create.reason || applicationPermissions.data.create.reason,
        },
      }}
      pageDescription={pageDescription}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
