import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { useJiraServerPermissions, useJiraServerWatchItem } from "@/k8s/api/groups/KRCI/JiraServer";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { integrationSecretName } from "@my-project/shared";
import React from "react";
import { CreateJiraForm } from "./components/CreateJiraForm";
import { JiraCard } from "./components/JiraCard";
import { EditJiraDialog } from "./components/EditJiraDialog";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { FORM_GUIDE_CONFIG } from "./components/CreateJiraForm/constants";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";

export default function JiraConfigurationPage() {
  const jiraServerWatch = useJiraServerWatchItem({
    name: "epam-jira",
  });
  const jiraServer = jiraServerWatch.query.data;

  const jiraServerSecretWatch = useSecretWatchItem({
    name: integrationSecretName.JIRA,
  });
  const jiraServerSecret = jiraServerSecretWatch.query.data;

  const secretPermissions = useSecretPermissions();
  const jiraServerPermissions = useJiraServerPermissions();

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);
  const handleOpenEditDialog = () => setEditDialogOpen(true);
  const handleCloseEditDialog = () => setEditDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const jiraServerError = jiraServerWatch.query.error && getForbiddenError(jiraServerWatch.query.error);
    const jiraServerSecretError =
      jiraServerSecretWatch.query.error && getForbiddenError(jiraServerSecretWatch.query.error);
    const isLoading = jiraServerWatch.query.isLoading || jiraServerSecretWatch.query.isLoading;

    if (jiraServerError || jiraServerSecretError) {
      return <ErrorContent error={jiraServerError || jiraServerSecretError} outlined />;
    }

    if (!jiraServerSecret && !isLoading && !jiraServerError && !jiraServerSecretError) {
      const hasPermission = secretPermissions.data.create.allowed && jiraServerPermissions.data.create.allowed;
      const permissionReason = secretPermissions.data.create.reason || jiraServerPermissions.data.create.reason;

      if (!hasPermission) {
        return <EmptyList customText={"No Jira integration secrets found."} beforeLinkText={permissionReason} />;
      }

      return (
        <EmptyList
          customText={"No Jira integration secrets found."}
          linkText={"Click here to add integration."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    if (jiraServerSecret) {
      const ownerReference = jiraServerSecret.metadata?.ownerReferences?.[0]?.kind;

      return (
        <>
          <JiraCard
            secret={jiraServerSecret}
            jiraServer={jiraServer}
            ownerReference={ownerReference}
            onEdit={handleOpenEditDialog}
          />
          <EditJiraDialog
            isOpen={isEditDialogOpen}
            onClose={handleCloseEditDialog}
            secret={jiraServerSecret}
            jiraServer={jiraServer}
            ownerReference={ownerReference}
          />
        </>
      );
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    jiraServerWatch.query.error,
    jiraServerWatch.query.isLoading,
    jiraServerSecretWatch.query.error,
    jiraServerSecretWatch.query.isLoading,
    jiraServerSecret,
    jiraServer,
    isEditDialogOpen,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: <CreateJiraForm jiraServer={jiraServer} onClose={handleCloseCreateDialog} />,
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: jiraServerWatch.query.isLoading || !!jiraServerSecret,
        permission: {
          allowed: secretPermissions.data.create.allowed && jiraServerPermissions.data.create.allowed,
          reason: secretPermissions.data.create.reason || jiraServerPermissions.data.create.reason,
        },
      }}
      pageDescription={pageDescription}
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_OPERATOR_GUIDE.JIRA.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
