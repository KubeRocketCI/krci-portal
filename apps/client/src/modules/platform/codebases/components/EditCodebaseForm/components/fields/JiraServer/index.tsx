import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { EDIT_CODEBASE_FORM_NAMES } from "../../../types";
import { useEditCodebaseForm } from "../../../providers/form/hooks";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";

export const JiraServer = () => {
  const form = useEditCodebaseForm();

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;
  const jiraServersNames = jiraServerList.map((jiraServer) => jiraServer.metadata.name);

  return (
    <form.AppField
      name={EDIT_CODEBASE_FORM_NAMES.jiraServer}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Select Jira server that will be integrated with the project.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Jira server"
          tooltipText="Select the Jira server to link your project with relevant project tasks."
          options={mapArrayToSelectOptions(jiraServersNames)}
        />
      )}
    </form.AppField>
  );
};
