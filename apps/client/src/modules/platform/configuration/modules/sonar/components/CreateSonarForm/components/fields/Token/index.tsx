import { NAMES } from "../../../constants";
import { useCreateSonarForm } from "../../../providers/form/hooks";

export const Token = ({ disabled }: { disabled?: boolean }) => {
  const form = useCreateSonarForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an API token for authentication with SonarQube. Generate the token from your SonarQube instance."
          placeholder="Enter token"
          disabled={disabled}
        />
      )}
    </form.AppField>
  );
};
