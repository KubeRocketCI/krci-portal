import { NAMES } from "../../../constants";
import { useCreateDefectDojoForm } from "../../../providers/form/hooks";

export const Token = () => {
  const form = useCreateDefectDojoForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an API token for authentication with DefectDojo. Generate the token from your DefectDojo instance and paste it here."
          placeholder="Enter token"
        />
      )}
    </form.AppField>
  );
};
