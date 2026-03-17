import { NAMES } from "../../../constants";
import { useEditNexusForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";
import { useStore } from "@tanstack/react-form";

export const URL: React.FC<{ ownerReference: string | undefined }> = ({ ownerReference }) => {
  const form = useEditNexusForm();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Enter the Nexus repository URL (e.g. http://nexus.nexus-namespace:8081 or https://nexus.example.com)."
          placeholder="Enter URL"
          disabled={!!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
