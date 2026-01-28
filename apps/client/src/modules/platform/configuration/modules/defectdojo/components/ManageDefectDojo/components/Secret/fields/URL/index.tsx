import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageDefectDojoForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const URL = () => {
  const form = useManageDefectDojoForm();
  const { mode, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Specify the URL where users can access the DefectDojo interface. Ensure to include the HTTP or HTTPS protocol (e.g., https://defectdojo.example.com)."
          placeholder="Enter URL"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
