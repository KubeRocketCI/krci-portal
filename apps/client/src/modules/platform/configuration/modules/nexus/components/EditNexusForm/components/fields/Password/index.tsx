import { NAMES } from "../../../constants";
import { useEditNexusForm } from "../../../providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const Password: React.FC<{ ownerReference: string | undefined }> = ({ ownerReference }) => {
  const form = useEditNexusForm();

  return (
    <form.AppField name={NAMES.PASSWORD}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Password"
          tooltipText="Enter the password associated with your Nexus repository username."
          placeholder="Enter password"
          disabled={!!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
        />
      )}
    </form.AppField>
  );
};
