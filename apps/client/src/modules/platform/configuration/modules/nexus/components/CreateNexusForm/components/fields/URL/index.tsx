import { NAMES } from "../../../constants";
import { useCreateNexusForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const URL = () => {
  const form = useCreateNexusForm();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Enter the Nexus repository URL (e.g. http://nexus.nexus-namespace:8081 or https://nexus.example.com)."
          placeholder="Enter URL"
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
