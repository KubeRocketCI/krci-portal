import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";

export const HTTPSPort = () => {
  const form = useManageGitServerForm();

  return (
    <form.AppField name={NAMES.HTTPS_PORT}>
      {(field) => (
        <field.FormTextField
          label="HTTPS port"
          tooltipText="Specify the HTTPS port used for Git server communication (the default value is 443)."
          placeholder="Enter HTTPS port"
          inputProps={{ type: "number" }}
        />
      )}
    </form.AppField>
  );
};
