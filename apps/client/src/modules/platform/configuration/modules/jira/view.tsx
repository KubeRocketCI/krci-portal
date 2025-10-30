import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import {
  getJiraServerStatusIcon,
  useJiraServerPermissions,
  useJiraServerWatchItem,
} from "@/k8s/api/groups/KRCI/JiraServer";
import { getForbiddenError } from "@/k8s/api/utils/get-forbidden-error";
import { Accordion, AccordionDetails, AccordionSummary, Tooltip } from "@mui/material";
import { integrationSecretName } from "@my-project/shared";
import { ShieldX } from "lucide-react";
import React from "react";
import { ConfigurationPageContent } from "../../components/ConfigurationPageContent";
import { ManageJiraServer } from "./components/ManageJiraServer";
import { pageDescription } from "./constants";

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

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => setCreateDialogOpen(false);

  const renderPageContent = React.useCallback(() => {
    const jiraServerError = jiraServerWatch.query.error && getForbiddenError(jiraServerWatch.query.error);
    const jiraServerSecretError =
      jiraServerSecretWatch.query.error && getForbiddenError(jiraServerSecretWatch.query.error);
    const isLoading = jiraServerWatch.query.isLoading || jiraServerSecretWatch.query.isLoading;

    if (jiraServerError || jiraServerSecretError) {
      return <ErrorContent error={jiraServerError || jiraServerSecretError} outlined />;
    }

    if (!jiraServerSecret && !isLoading && !jiraServerError && !jiraServerSecretError) {
      return (
        <>
          <EmptyList
            customText={"No Jira integration secrets found."}
            linkText={"Click here to add integration."}
            handleClick={handleOpenCreateDialog}
          />
        </>
      );
    }

    const ownerReference = jiraServerSecret?.metadata?.ownerReferences?.[0]?.kind;

    const status = jiraServer?.status?.status;
    const errorMessage = jiraServer?.status?.detailed_message;

    const statusIcon = getJiraServerStatusIcon(jiraServer);

    return (
      <LoadingWrapper isLoading={isLoading}>
        <Accordion expanded>
          <AccordionSummary style={{ cursor: "default" }}>
            <h6 className="text-base font-medium">
              <div className="flex gap-2 items-center">
                <div className="mr-1">
                  <StatusIcon
                    Icon={statusIcon.component}
                    color={statusIcon.color}
                    Title={
                      <>
                        <p className="text-sm font-semibold">
                          {`Status: ${status === undefined ? "Unknown" : status}`}
                        </p>
                        {!!errorMessage && (
                          <p className="text-sm font-medium mt-3">
                            {errorMessage}
                          </p>
                        )}
                      </>
                    }
                  />
                </div>
                <div>{jiraServerSecret?.metadata.name}</div>
                {!!ownerReference && (
                  <div>
                    <Tooltip title={`Managed by ${ownerReference}`}>
                      <ShieldX size={20} />
                    </Tooltip>
                  </div>
                )}
              </div>
            </h6>
          </AccordionSummary>
          <AccordionDetails>
            <ManageJiraServer
              secret={jiraServerSecret}
              jiraServer={jiraServer}
              ownerReference={ownerReference}
              handleClosePanel={handleCloseCreateDialog}
            />
          </AccordionDetails>
        </Accordion>
      </LoadingWrapper>
    );
  }, [
    jiraServerWatch.query.error,
    jiraServerWatch.query.isLoading,
    jiraServerSecretWatch.query.error,
    jiraServerSecretWatch.query.isLoading,
    jiraServerSecret,
    jiraServer,
  ]);

  return (
    <ConfigurationPageContent
      creationForm={{
        label: "Add Integration",
        component: (
          <ManageJiraServer
            secret={jiraServerSecret}
            jiraServer={jiraServer}
            ownerReference={undefined}
            handleClosePanel={handleCloseCreateDialog}
          />
        ),
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
    >
      {renderPageContent()}
    </ConfigurationPageContent>
  );
}
