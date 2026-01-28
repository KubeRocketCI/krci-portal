import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageDependencyTrackForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const URL = () => {
  const form = useManageDependencyTrackForm();
  const { mode, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Enter the URL of your Dependency Track instance."
          placeholder="Enter URL"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
