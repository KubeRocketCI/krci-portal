import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";

export const SSHPort = () => {
  const form = useCreateGitServerForm();

  return (
    <form.AppField name={NAMES.SSH_PORT}>
      {(field) => (
        <field.FormTextField
          label="SSH port"
          tooltipText="Specify the SSH port used for Git server communication (default is 22)."
          placeholder="Enter SSH port"
          inputProps={{ type: "number" }}
        />
      )}
    </form.AppField>
  );
};
