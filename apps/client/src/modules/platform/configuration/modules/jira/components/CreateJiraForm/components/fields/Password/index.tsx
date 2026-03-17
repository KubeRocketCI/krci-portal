import { NAMES } from "../../../constants";
import { useCreateJiraForm } from "../../../providers/form/hooks";

export const Password = () => {
  const form = useCreateJiraForm();

  return (
    <form.AppField name={NAMES.PASSWORD}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Password"
          tooltipText="Provide the password associated with your Jira account."
          placeholder="Enter password"
        />
      )}
    </form.AppField>
  );
};
