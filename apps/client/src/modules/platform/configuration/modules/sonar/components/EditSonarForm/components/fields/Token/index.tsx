import { NAMES } from "../../../constants";
import { useEditSonarForm } from "../../../providers/form/hooks";

export const Token = ({ disabled }: { disabled?: boolean }) => {
  const form = useEditSonarForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          label="Token"
          tooltipText="Enter the API token for SonarQube authentication."
          placeholder="Enter token"
          type="password"
          disabled={disabled}
        />
      )}
    </form.AppField>
  );
};
