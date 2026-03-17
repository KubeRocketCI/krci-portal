import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import React from "react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { CreateGitOpsForm } from "./components/CreateGitOpsForm";
import { pageDescription } from "./constants";
import { useCodebasePermissions, useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, codebaseType } from "@my-project/shared";
import { PATH_CONFIG_GITSERVERS_FULL } from "../gitservers/route";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { FORM_GUIDE_CONFIG } from "./components/CreateGitOpsForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { GitOpsCard } from "./components/GitOpsCard";
import { EditGitOpsDialog } from "./components/EditGitOpsDialog";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export default function GitopsConfigurationPage() {
  const { defaultNamespace } = useClusterStore(useShallow((state) => ({ defaultNamespace: state.defaultNamespace })));

  const gitOpsCodebasesWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.system,
      [codebaseLabels.systemType]: "gitops",
    },
  });
  const gitOpsCodebase = gitOpsCodebasesWatch.data.array[0];

  const codebasePermissions = useCodebasePermissions();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const error = gitOpsCodebasesWatch.query.error || gitServersWatch.query.error;
  const isLoading = !gitOpsCodebasesWatch.isReady || !gitServersWatch.isReady;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = React.useCallback(() => setCreateDialogOpen(true), []);
  const handleCloseCreateDialog = React.useCallback(() => setCreateDialogOpen(false), []);
  const handleOpenEditDialog = React.useCallback(() => setEditDialogOpen(true), []);
  const handleCloseEditDialog = React.useCallback(() => setEditDialogOpen(false), []);

  const renderPageContent = React.useCallback(() => {
    const forbiddenError = error && getForbiddenError(error);

    if (forbiddenError) {
      return <ErrorContent error={forbiddenError} outlined />;
    }

    if (!isLoading && !gitServers?.length && !codebasePermissions.data.create.allowed) {
      return <EmptyList customText={codebasePermissions.data.create.reason} />;
    }

    if (!isLoading && !gitServers?.length) {
      return (
        <EmptyList
          customText={"No Git Servers Connected."}
          linkText={"Click here to add a Git Server."}
          route={{
            to: PATH_CONFIG_GITSERVERS_FULL,
            params: {
              namespace: defaultNamespace,
            },
          }}
        />
      );
    }

    if (!isLoading && !gitOpsCodebase && !error) {
      if (!codebasePermissions.data.create.allowed) {
        return (
          <EmptyList
            customText={"No GitOps repositories found."}
            beforeLinkText={codebasePermissions.data.create.reason}
          />
        );
      }

      return (
        <EmptyList
          customText={"No GitOps repositories found."}
          linkText={"Click here to add GitOps repository."}
          handleClick={handleOpenCreateDialog}
        />
      );
    }

    if (!gitOpsCodebase) {
      return <LoadingWrapper isLoading={isLoading}>{null}</LoadingWrapper>;
    }

    return (
      <LoadingWrapper isLoading={isLoading}>
        <GitOpsCard codebase={gitOpsCodebase} onEdit={handleOpenEditDialog} />
        {isEditDialogOpen && (
          <EditGitOpsDialog isOpen={isEditDialogOpen} onClose={handleCloseEditDialog} codebase={gitOpsCodebase} />
        )}
      </LoadingWrapper>
    );
  }, [
    codebasePermissions.data.create.allowed,
    codebasePermissions.data.create.reason,
    defaultNamespace,
    error,
    gitOpsCodebase,
    gitServers?.length,
    isLoading,
    isEditDialogOpen,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseEditDialog,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add GitOps repository",
        component: <CreateGitOpsForm onClose={handleCloseCreateDialog} />,
        isOpen: isCreateDialogOpen,
        onOpen: handleOpenCreateDialog,
        onClose: handleCloseCreateDialog,
        isDisabled: isLoading || !!gitOpsCodebase,
        permission: {
          allowed: codebasePermissions.data.create.allowed,
          reason: codebasePermissions.data.create.reason,
        },
      }}
      pageDescription={pageDescription}
      formGuideConfig={FORM_GUIDE_CONFIG}
      formGuideDocUrl={EDP_USER_GUIDE.GIT_OPS.url}
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
