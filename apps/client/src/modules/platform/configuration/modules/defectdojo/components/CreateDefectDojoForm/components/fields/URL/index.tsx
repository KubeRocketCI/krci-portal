import { NAMES } from "../../../constants";
import { useCreateDefectDojoForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const URL = () => {
  const form = useCreateDefectDojoForm();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Specify the URL where users can access the DefectDojo interface. Ensure to include the HTTP or HTTPS protocol (e.g., https://defectdojo.example.com)."
          placeholder="Enter URL"
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
