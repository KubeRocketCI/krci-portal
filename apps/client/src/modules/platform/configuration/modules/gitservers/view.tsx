import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { useGitServerPermissions, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import React from "react";
import { CreateGitServerForm } from "./components/CreateGitServerForm";
import { GitServerCard } from "./components/GitServerCard";
import { EditGitServerDialog } from "./components/EditGitServerDialog";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { FORM_GUIDE_CONFIG } from "./components/CreateGitServerForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import type { GitServer } from "@my-project/shared";

export default function GitserversConfigurationPage() {
  const gitServerWatch = useGitServerWatchList();
  const gitServers = gitServerWatch.data.array;

  const secretPermissions = useSecretPermissions();
  const gitServerPermissions = useGitServerPermissions();

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [editingGitServer, setEditingGitServer] = React.useState<GitServer | null>(null);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);
  const handleOpenEditDialog = (gitServer: GitServer) => setEditingGitServer(gitServer);
  const handleCloseEditDialog = () => setEditingGitServer(null);

  const renderPageContent = React.useCallback(() => {
    const gitServerError = gitServerWatch.query.error && getForbiddenError(gitServerWatch.query.error);
    const isLoading = gitServerWatch.query.isLoading;

    if (gitServerError) {
      return <ErrorContent error={gitServerError} outlined />;
    }

    if (!gitServers?.length && !isLoading && !gitServerError) {
      const hasPermission = secretPermissions.data.create.allowed && gitServerPermissions.data.create.allowed;
      const permissionReason = secretPermissions.data.create.reason || gitServerPermissions.data.create.reason;

      if (!hasPermission) {
        return <EmptyList customText={"No GitServers found."} beforeLinkText={permissionReason} />;
      }

      return (
        <EmptyList
          customText={"No GitServers found."}
          linkText={"Click here to add GitServer."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    return (
      <LoadingWrapper isLoading={isLoading}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gitServers?.map((gitServer) => (
            <GitServerCard
              key={gitServer.metadata.uid}
              gitServer={gitServer}
              onEdit={() => handleOpenEditDialog(gitServer)}
            />
          ))}
        </div>
        {editingGitServer && (
          <EditGitServerDialog
            isOpen={!!editingGitServer}
            onClose={handleCloseEditDialog}
            gitServer={editingGitServer}
            webhookURL={editingGitServer.spec?.gitHost ? `https://${editingGitServer.spec.gitHost}` : ""}
          />
        )}
      </LoadingWrapper>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [gitServerWatch.query.error, gitServerWatch.query.isLoading, gitServers, editingGitServer]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add GitServer",
        component: <CreateGitServerForm onClose={handleCloseCreateDialog} />,
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: gitServerWatch.query.isLoading,
        permission: {
          allowed: secretPermissions.data.create.allowed && gitServerPermissions.data.create.allowed,
          reason: secretPermissions.data.create.reason || gitServerPermissions.data.create.reason,
        },
      }}
      pageDescription={pageDescription}
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_USER_GUIDE.GIT_SERVER_CREATE.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
