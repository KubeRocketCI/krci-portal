import { Alert } from "@/core/components/ui/alert";
import { EDIT_CODEBASE_FORM_NAMES } from "../../../types";
import { useEditCodebaseForm } from "../../../providers/form/hooks";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";

export const JiraServerIntegration = () => {
  const form = useEditCodebaseForm();

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
        <form.AppField name={EDIT_CODEBASE_FORM_NAMES.hasJiraServerIntegration}>
          {(field) => (
            <field.FormSwitch
              label="Integrate with Jira server"
              helperText="Enable this to integrate with Jira server. This will allow you to create Jira issues from the codebase."
              disabled={jiraServerListWatch.isEmpty}
              rich
            />
          )}
        </form.AppField>
      </div>
    </div>
  );
};
