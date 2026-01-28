import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageArgoCDForm } from "../../../../providers/form/hooks";

export const Token = () => {
  const form = useManageArgoCDForm();
  const { ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an authentication token for Argo CD. Generate the token from your Argo CD instance."
          placeholder="Enter token"
          disabled={!!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
