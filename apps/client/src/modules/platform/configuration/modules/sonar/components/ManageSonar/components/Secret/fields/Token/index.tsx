import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageSonarForm } from "../../../../providers/form/hooks";

export const Token = () => {
  const form = useManageSonarForm();
  const { ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an API token for authentication with SonarQube. Generate the token from your SonarQube instance."
          placeholder="Enter token"
          disabled={!!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
