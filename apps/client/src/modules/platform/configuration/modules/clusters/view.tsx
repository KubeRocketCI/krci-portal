import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useSecretPermissions, useSecretWatchList } from "@/k8s/api/groups/Core/Secret";
import { useApplicationPermissions } from "@/k8s/api/groups/ArgoCD/Application";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { SECRET_LABEL_SECRET_TYPE } from "@my-project/shared";
import React from "react";
import { CreateClusterSecretForm } from "./components/CreateClusterSecretForm";
import { ClusterCard } from "./components/ClusterCard";
import { EditClusterDialog } from "./components/EditClusterDialog";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { FORM_GUIDE_CONFIG } from "./components/CreateClusterSecretForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import type { Secret } from "@my-project/shared";

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
  const [editingCluster, setEditingCluster] = React.useState<Secret | null>(null);

  const handleOpenCreateDialog = React.useCallback(() => setCreateDialogOpen(true), []);
  const handleCloseCreateDialog = React.useCallback(() => setCreateDialogOpen(false), []);
  const handleOpenEditDialog = React.useCallback((clusterSecret: Secret) => setEditingCluster(clusterSecret), []);
  const handleCloseEditDialog = React.useCallback(() => setEditingCluster(null), []);

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

    return (
      <LoadingWrapper isLoading={isLoading}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clusterSecrets?.map((clusterSecret) => (
            <ClusterCard
              key={clusterSecret.metadata.uid}
              clusterSecret={clusterSecret}
              onEdit={() => handleOpenEditDialog(clusterSecret)}
            />
          ))}
        </div>
        {editingCluster && (
          <EditClusterDialog
            isOpen={!!editingCluster}
            onClose={handleCloseEditDialog}
            clusterSecret={editingCluster}
            ownerReference={editingCluster?.metadata?.ownerReferences?.[0]?.kind}
          />
        )}
      </LoadingWrapper>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [clusterSecretsWatch.query.error, clusterSecretsWatch.query.isLoading, clusterSecrets, editingCluster]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Cluster",
        component: <CreateClusterSecretForm onClose={handleCloseCreateDialog} />,
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
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_USER_GUIDE.CLUSTER_CREATE.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
