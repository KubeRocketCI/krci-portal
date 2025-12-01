import React from "react";
import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { Alert } from "@/core/components/ui/alert";
import { useFormContext } from "react-hook-form";
import { CREATE_WIZARD_NAMES } from "../names";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";

interface JiraServerIntegrationFieldProps {
  name?: string;
  expandableContent?: React.ReactNode;
}

export const JiraServerIntegrationField: React.FC<JiraServerIntegrationFieldProps> = ({
  name = CREATE_WIZARD_NAMES.ui_hasJiraServerIntegration,
  expandableContent,
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;

  const hasNoJiraServers = !jiraServerList.length;

  return (
    <div className={hasNoJiraServers ? "flex gap-4" : "w-full"}>
      {hasNoJiraServers && (
        <div className="w-1/2">
          <Alert variant="default">There are no available Jira servers</Alert>
        </div>
      )}
      <div className={hasNoJiraServers ? "w-1/2" : "w-full"}>
        <FormSwitchRich
          {...register(name)}
          label="Integrate with Jira server"
          helperText="Enable this to integrate with Jira server. This will allow you to create Jira issues from the codebase."
          control={control}
          errors={errors}
          disabled={jiraServerListWatch.isEmpty}
          expandableContent={expandableContent}
        />
      </div>
    </div>
  );
};
