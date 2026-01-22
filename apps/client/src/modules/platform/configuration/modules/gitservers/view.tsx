import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { useGitServerPermissions, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { getGitServerStatusIcon } from "@/k8s/api/groups/KRCI/GitServer/utils";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import React from "react";
import { ManageGitServer } from "./components/ManageGitServer";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { pageDescription } from "./constants";

export default function GitserversConfigurationPage() {
  const gitServerWatch = useGitServerWatchList();
  const gitServers = gitServerWatch.data.array;

  const secretPermissions = useSecretPermissions();
  const gitServerPermissions = useGitServerPermissions();

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [expandedPanel, setExpandedPanel] = React.useState<string | undefined>(undefined);

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const handleChange = React.useCallback((value: string) => {
    setExpandedPanel(value === "" ? undefined : value);
  }, []);

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

    const singleItem = gitServers?.length === 1;

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion
          type="single"
          collapsible
          value={singleItem ? gitServers?.[0]?.metadata.name : expandedPanel}
          onValueChange={singleItem ? undefined : handleChange}
        >
          <div className="flex flex-col gap-2">
            {gitServers?.map((gitServer) => {
              const connected = gitServer?.status?.connected;
              const error = gitServer?.status?.error;

              const statusIcon = getGitServerStatusIcon(gitServer);

              const gitServerName = gitServer.metadata.name;
              const isExpanded = singleItem || expandedPanel === gitServerName;

              // Get webhook URL from the GitServer spec or status
              const webhookURL = gitServer.spec?.gitHost ? `https://${gitServer.spec.gitHost}` : "";

              return (
                <div key={gitServer.metadata.uid}>
                  <AccordionItem value={gitServerName}>
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
                          <div>{gitServerName}</div>
                        </div>
                      </h6>
                    </AccordionTrigger>
                    <AccordionContent>
                      {isExpanded && (
                        <ManageGitServer
                          gitServer={gitServer}
                          webhookURL={webhookURL}
                          handleClosePanel={handleCloseCreateDialog}
                        />
                      )}
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
  }, [gitServerWatch.query.error, gitServerWatch.query.isLoading, gitServers, expandedPanel, handleChange]);

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
