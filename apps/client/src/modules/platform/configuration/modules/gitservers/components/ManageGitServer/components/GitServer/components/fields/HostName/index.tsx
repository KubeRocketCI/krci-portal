import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";

export const HostName = () => {
  const form = useManageGitServerForm();

  return (
    <form.AppField name={NAMES.GIT_HOST}>
      {(field) => (
        <field.FormTextField
          label="Host"
          tooltipText="Enter the hostname or IP address of your Git Server (e.g., github.com)."
          placeholder="host-name.com"
        />
      )}
    </form.AppField>
  );
};
