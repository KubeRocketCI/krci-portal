import { NAMES } from "@/modules/platform/configuration/modules/jira/components/ManageJiraServer/names";
import { useManageJiraServerForm } from "@/modules/platform/configuration/modules/jira/components/ManageJiraServer/providers/form/hooks";

export const URL = () => {
  const form = useManageJiraServerForm();

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Provide the base URL of your Jira instance without any specific paths or endpoints (e.g., https://your-jira-instance.com)."
          placeholder="Enter Jira URL"
        />
      )}
    </form.AppField>
  );
};
