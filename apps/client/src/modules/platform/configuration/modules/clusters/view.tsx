import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useSecretPermissions, useSecretWatchList } from "@/k8s/api/groups/Core/Secret";
import { useApplicationPermissions } from "@/k8s/api/groups/ArgoCD/Application";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { Tooltip } from "@/core/components/ui/tooltip";
import {
  SECRET_LABEL_SECRET_TYPE,
  SECRET_ANNOTATION_CLUSTER_CONNECTED,
  SECRET_ANNOTATION_CLUSTER_ERROR,
} from "@my-project/shared";
import React from "react";
import { ManageClusterSecret } from "./components/ManageClusterSecret";
import { getClusterSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
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
  const [expandedPanel, setExpandedPanel] = React.useState<string | undefined>(undefined);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const handleChange = React.useCallback((value: string) => {
    setExpandedPanel(value === "" ? undefined : value);
  }, []);

  const renderPageContent = React.useCallback(() => {
    const clusterSecretsError = clusterSecretsWatch.query.error && getForbiddenError(clusterSecretsWatch.query.error);
    const isLoading = clusterSecretsWatch.query.isLoading;

    if (clusterSecretsError) {
      return <ErrorContent error={clusterSecretsError} outlined />;
    }

    if (!clusterSecrets?.length && !isLoading && !clusterSecretsError) {
      const hasPermission = secretPermissions.data.create.allowed && applicationPermissions.data.create.allowed;
      const permissionReason = secretPermissions.data.create.reason || applicationPermissions.data.create.reason;

      if (!hasPermission) {
        return <EmptyList customText={"No cluster secrets found."} beforeLinkText={permissionReason} />;
      }

      return (
        <EmptyList
          customText={"No cluster secrets found."}
          linkText={"Click here to add cluster."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    const singleItem = clusterSecrets?.length === 1;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion
          type="single"
          collapsible
          value={singleItem ? clusterSecrets?.[0]?.metadata.name : (expandedPanel ?? "")}
          onValueChange={singleItem ? undefined : handleChange}
        >
          <div className="flex flex-col gap-2">
            {clusterSecrets?.map((clusterSecret) => {
              const connected = clusterSecret?.metadata?.annotations?.[SECRET_ANNOTATION_CLUSTER_CONNECTED];
              const error = clusterSecret?.metadata?.annotations?.[SECRET_ANNOTATION_CLUSTER_ERROR];

              // Use the integration secret status icon for cluster secrets
              const statusIcon = getClusterSecretStatusIcon(clusterSecret);

              const clusterName = clusterSecret.metadata.name;
              const ownerReference = clusterSecret?.metadata?.ownerReferences?.[0]?.kind;

              return (
                <div key={clusterSecret.metadata.uid}>
                  <AccordionItem value={clusterName}>
                    <AccordionTrigger className={singleItem ? "cursor-default" : "cursor-pointer"}>
                      <h6 className="text-base font-medium">
                        <div className="flex items-center gap-2">
                          <div className="mr-1">
                            <StatusIcon
                              Icon={statusIcon.component}
                              color={statusIcon.color}
                              Title={
                                <>
                                  <p className="text-sm font-semibold">
                                    {`Connected: ${connected === undefined ? "Unknown" : connected}`}
                                  </p>
                                  {!!error && <p className="mt-3 text-sm font-medium">{error}</p>}
                                </>
                              }
                            />
                          </div>
                          <div>{clusterName}</div>
                          {!!ownerReference && (
                            <div>
                              <Tooltip title={`Managed by ${ownerReference}`}>
                                <ShieldX size={20} />
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </h6>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ManageClusterSecret
                        formData={{
                          currentElement: clusterSecret,
                          ownerReference: ownerReference,
                          mode: FORM_MODES.EDIT,
                          handleClosePlaceholder: handleCloseCreateDialog,
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </div>
              );
            })}
          </div>
        </Accordion>
      </LoadingWrapper>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    clusterSecretsWatch.query.error,
    clusterSecretsWatch.query.isLoading,
    clusterSecrets,
    expandedPanel,
    handleChange,
  ]);

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
