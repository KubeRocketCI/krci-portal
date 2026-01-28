import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageNexusForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const URL = () => {
  const form = useManageNexusForm();
  const { mode, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Enter the Nexus repository URL (e.g. http://nexus.nexus-namespace:8081 or https://nexus.example.com)."
          placeholder="Enter URL"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
