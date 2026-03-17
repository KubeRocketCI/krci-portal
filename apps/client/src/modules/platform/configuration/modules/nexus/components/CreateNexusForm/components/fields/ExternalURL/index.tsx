import { NAMES } from "../../../constants";
import { useCreateNexusForm } from "../../../providers/form/hooks";
import { OpenExternalLinkButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const ExternalURL = () => {
  const form = useCreateNexusForm();
  const externalUrl = useStore(form.store, (state) => state.values[NAMES.EXTERNAL_URL]);

  return (
    <form.AppField
      name={NAMES.EXTERNAL_URL}
      listeners={{
        onChange: ({ value }) => {
          form.setFieldValue(NAMES.URL, value);
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Quick Link URL"
          tooltipText="Enter the external URL of your Nexus instance."
          placeholder="Enter URL"
          suffix={<OpenExternalLinkButton getUrl={() => externalUrl} />}
        />
      )}
    </form.AppField>
  );
};
