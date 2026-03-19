import { NAMES } from "../../../constants";
import { useEditSonarForm } from "../../../providers/form/hooks";

export const URL = ({ disabled }: { disabled?: boolean }) => {
  const form = useEditSonarForm();

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Enter the SonarQube URL."
          placeholder="Enter URL"
          disabled={disabled}
        />
      )}
    </form.AppField>
  );
};
