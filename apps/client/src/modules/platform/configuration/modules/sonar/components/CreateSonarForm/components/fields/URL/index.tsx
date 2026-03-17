import { NAMES } from "../../../constants";
import { useCreateSonarForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const URL = ({ disabled }: { disabled?: boolean }) => {
  const form = useCreateSonarForm();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Enter the URL of your SonarQube instance."
          placeholder="Enter URL"
          suffix={<CopyToClipboardButton getValue={() => url} />}
          disabled={disabled}
        />
      )}
    </form.AppField>
  );
};
