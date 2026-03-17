import { NAMES } from "../../../constants";
import { useCreateDependencyTrackForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const URL = () => {
  const form = useCreateDependencyTrackForm();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Specify the URL where users can access the Dependency-Track interface. Ensure to include the HTTP or HTTPS protocol (e.g., https://dependency-track.example.com)."
          placeholder="Enter URL"
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
