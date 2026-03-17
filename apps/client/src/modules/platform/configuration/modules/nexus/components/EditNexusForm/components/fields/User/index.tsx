import { NAMES } from "../../../constants";
import { useEditNexusForm } from "../../../providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const User: React.FC<{ ownerReference: string | undefined }> = ({ ownerReference }) => {
  const form = useEditNexusForm();

  return (
    <form.AppField name={NAMES.USERNAME}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Provide your Nexus repository username for authentication."
          placeholder="Enter user name"
          disabled={!!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
        />
      )}
    </form.AppField>
  );
};
