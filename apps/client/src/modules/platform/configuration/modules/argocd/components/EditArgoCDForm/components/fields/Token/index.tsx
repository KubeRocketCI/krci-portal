import { NAMES } from "../../../constants";
import { useEditArgoCDForm } from "../../../providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

interface TokenProps {
  ownerReference: string | undefined;
}

export const Token: React.FC<TokenProps> = ({ ownerReference }) => {
  const form = useEditArgoCDForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an authentication token for Argo CD. Generate the token from your Argo CD instance."
          placeholder="Enter token"
          disabled={!!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
        />
      )}
    </form.AppField>
  );
};
