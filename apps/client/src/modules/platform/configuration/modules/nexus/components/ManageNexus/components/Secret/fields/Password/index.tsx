import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageNexusForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const Password = () => {
  const form = useManageNexusForm();
  const { mode, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.PASSWORD}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Password"
          tooltipText="Enter the password associated with your Nexus repository username."
          placeholder="Enter password"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
