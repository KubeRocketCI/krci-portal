import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";

export const UserName = () => {
  const form = useCreateGitServerForm();

  return (
    <form.AppField name={NAMES.GIT_USER}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Provide the username associated with your Git account."
          placeholder="git"
        />
      )}
    </form.AppField>
  );
};
