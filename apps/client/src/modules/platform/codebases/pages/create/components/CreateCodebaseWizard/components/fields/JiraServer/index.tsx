import React from "react";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const JiraServer: React.FC = () => {
  const form = useCreateCodebaseForm();
  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServersNames = jiraServerListWatch.data.array.map((j) => j.metadata.name);

  return (
    <form.AppField
      name={NAMES.jiraServer}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Select Jira server that will be integrated with the codebase.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Jira server"
          tooltipText="Select the Jira server to link your component with relevant project tasks."
          options={mapArrayToSelectOptions(jiraServersNames)}
        />
      )}
    </form.AppField>
  );
};
