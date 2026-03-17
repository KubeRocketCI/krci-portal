import { NAMES } from "../../../constants";
import { useCreateJiraForm } from "../../../providers/form/hooks";

export const Username = () => {
  const form = useCreateJiraForm();

  return (
    <form.AppField name={NAMES.USERNAME}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Enter your Jira username for authentication. This is typically the username associated with your Jira account."
          placeholder="Enter user name"
        />
      )}
    </form.AppField>
  );
};
