import { NAMES } from "../../../constants";
import { useCreateArgoCDForm } from "../../../providers/form/hooks";

export const Token = () => {
  const form = useCreateArgoCDForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an authentication token for Argo CD. Generate the token from your Argo CD instance."
          placeholder="Enter token"
        />
      )}
    </form.AppField>
  );
};
