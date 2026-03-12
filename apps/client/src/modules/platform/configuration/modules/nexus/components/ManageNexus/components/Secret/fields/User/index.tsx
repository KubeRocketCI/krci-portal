import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageNexusForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const User = () => {
  const form = useManageNexusForm();
  const { mode, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.USERNAME}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Provide your Nexus repository username for authentication."
          placeholder="Enter user name"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
        />
      )}
    </form.AppField>
  );
};
