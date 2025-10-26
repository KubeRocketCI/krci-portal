import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionDetails, AccordionSummary, Button, Grid, Link, Typography } from "@mui/material";
import React from "react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { ManageGitOps } from "./components/ManageGitOps";
import { pageDescription } from "./constants";
import { getCodebaseStatusIcon, useCodebasePermissions, useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, codebaseStatus, codebaseType } from "@my-project/shared";
import { PATH_CONFIG_GITSERVERS_FULL } from "../gitservers/route";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { FolderGit2 } from "lucide-react";

export default function GitopsConfigurationPage() {
  const gitOpsCodebasesWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.system,
      [codebaseLabels.systemType]: "gitops",
    },
  });
  const gitOpsCodebase = gitOpsCodebasesWatch.data.array[0];
  const status = gitOpsCodebase?.status?.status;

  const codebasePermissions = useCodebasePermissions();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const error = gitOpsCodebasesWatch.query.error || gitServersWatch.query.error;
  const isLoading = !gitOpsCodebasesWatch.isReady || !gitServersWatch.isReady;

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

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
              namespace: "asd",
            },
          }}
        />
      );
    }

    if (!isLoading && !gitOpsCodebase && !error) {
      return (
        <>
          <EmptyList
            customText={"No GitOps repositories found."}
            linkText={"Click here to add GitOps repository."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const codebaseStatusIcon = getCodebaseStatusIcon(gitOpsCodebase);

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion expanded>
          <AccordionSummary>
            <Grid container spacing={1} alignItems={"center"}>
              <Grid item sx={{ mr: (t) => t.typography.pxToRem(5) }}>
                <StatusIcon
                  Icon={codebaseStatusIcon.component}
                  color={codebaseStatusIcon.color}
                  isSpinning={codebaseStatusIcon.isSpinning}
                  Title={
                    <>
                      <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                        {`Status: ${status || "Unknown"}`}
                      </Typography>
                      {status === codebaseStatus.failed && (
                        <Typography variant={"subtitle2"} sx={{ mt: (t) => t.typography.pxToRem(10) }}>
                          {gitOpsCodebase?.status?.detailedMessage}
                        </Typography>
                      )}
                    </>
                  }
                />
              </Grid>
              <Grid item>GitOps</Grid>
              <Grid item sx={{ ml: "auto" }}>
                <Button
                  component={Link}
                  href={gitOpsCodebase?.status?.gitWebUrl}
                  target="_blank"
                  startIcon={<FolderGit2 size={16} />}
                >
                  Go to the Source Code
                </Button>
              </Grid>
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <ManageGitOps
              formData={{
                currentElement: gitOpsCodebase,
                isReadOnly: true,
              }}
            />
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    codebasePermissions.data.create.allowed,
    codebasePermissions.data.create.reason,
    error,
    gitOpsCodebase,
    gitServers?.length,
    isLoading,
    status,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add GitOps repository",
        component: (
          <ManageGitOps
            formData={{
              currentElement: "placeholder",
              handleClosePlaceholder: handleCloseCreateDialog,
            }}
          />
        ),
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
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
