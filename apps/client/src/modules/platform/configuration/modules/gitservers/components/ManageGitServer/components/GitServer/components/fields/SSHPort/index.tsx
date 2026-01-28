import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";

export const SSHPort = () => {
  const form = useManageGitServerForm();

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
