import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";

export const Name = () => {
  const form = useCreateGitServerForm();

  return (
    <form.AppField name={NAMES.NAME}>
      {(field) => (
        <field.FormTextField
          label="Name"
          tooltipText="Enter the name of your Git Server (e.g., my-github)."
          placeholder="my-github"
        />
      )}
    </form.AppField>
  );
};
