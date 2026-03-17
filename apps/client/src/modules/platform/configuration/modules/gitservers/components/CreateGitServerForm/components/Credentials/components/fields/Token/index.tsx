import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";

export const Token = () => {
  const form = useCreateGitServerForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide the token for Git server authentication."
          placeholder="Enter token"
        />
      )}
    </form.AppField>
  );
};
