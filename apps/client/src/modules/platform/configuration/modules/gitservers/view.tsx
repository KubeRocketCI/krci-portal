import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { useGitServerPermissions, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { getGitServerStatusIcon } from "@/k8s/api/groups/KRCI/GitServer/utils";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionSummary, Typography, AccordionDetails, Grid } from "@mui/material";
import React from "react";
import { ManageGitServer } from "./components/ManageGitServer";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";
import { ChevronDown } from "lucide-react";

export default function GitserversConfigurationPage() {
  const gitServerWatch = useGitServerWatchList();
  const gitServers = gitServerWatch.data.array;

  const secretPermissions = useSecretPermissions();
  const gitServerPermissions = useGitServerPermissions();

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [expandedPanel, setExpandedPanel] = React.useState<string | null>(null);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const renderPageContent = React.useCallback(() => {
    const gitServerError = gitServerWatch.query.error && getForbiddenError(gitServerWatch.query.error);
    const isLoading = gitServerWatch.query.isLoading;

    if (gitServerError) {
      return <ErrorContent error={gitServerError} outlined />;
    }

    if (!gitServers?.length && !isLoading && !gitServerError) {
      return (
        <>
          <EmptyList
            customText={"No GitServers found."}
            linkText={"Click here to add GitServer."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const singleItem = gitServers?.length === 1;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Grid container spacing={1}>
          {gitServers?.map((gitServer) => {
            const connected = gitServer?.status?.connected;
            const error = gitServer?.status?.error;

            const statusIcon = getGitServerStatusIcon(gitServer);

            const gitServerName = gitServer.metadata.name;
            const isExpanded = expandedPanel === gitServerName;

            // Get webhook URL from the GitServer spec or status
            const webhookURL = gitServer.spec?.gitHost ? `https://${gitServer.spec.gitHost}` : "";

            return (
              <Grid item xs={12} key={gitServer.metadata.uid}>
                <Accordion
                  expanded={singleItem || isExpanded}
                  onChange={singleItem ? undefined : handleChange(gitServerName)}
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
                        <Grid item>{gitServerName}</Grid>
                      </Grid>
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(singleItem || isExpanded) && (
                      <ManageGitServer
                        gitServer={gitServer}
                        webhookURL={webhookURL}
                        handleClosePanel={handleCloseCreateDialog}
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
  }, [gitServerWatch.query.error, gitServerWatch.query.isLoading, gitServers, expandedPanel]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add GitServer",
        component: (
          <ManageGitServer gitServer={undefined} webhookURL={undefined} handleClosePanel={handleCloseCreateDialog} />
        ),
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
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
