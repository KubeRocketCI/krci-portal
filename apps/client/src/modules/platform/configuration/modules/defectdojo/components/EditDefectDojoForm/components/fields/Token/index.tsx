import { NAMES } from "../../../constants";
import { useEditDefectDojoForm } from "../../../providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

interface TokenProps {
  ownerReference: string | undefined;
}

export const Token: React.FC<TokenProps> = ({ ownerReference }) => {
  const form = useEditDefectDojoForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide an API token for authentication with DefectDojo. Generate the token from your DefectDojo instance and paste it here."
          placeholder="Enter token"
          disabled={!!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
        />
      )}
    </form.AppField>
  );
};
