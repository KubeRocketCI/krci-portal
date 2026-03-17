import { NAMES } from "../../../constants";
import { useCreateDefectDojoForm } from "../../../providers/form/hooks";
import { OpenExternalLinkButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const ExternalURL = () => {
  const form = useCreateDefectDojoForm();
  const externalUrl = useStore(form.store, (state) => state.values[NAMES.EXTERNAL_URL]);

  return (
    <form.AppField
      name={NAMES.EXTERNAL_URL}
      listeners={{
        // In create mode, sync externalUrl to secret.url field
        onChange: ({ value }) => {
          form.setFieldValue(NAMES.URL, value);
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Quick Link URL"
          tooltipText="Enter the external URL of your DefectDojo instance."
          placeholder="Enter URL"
          suffix={<OpenExternalLinkButton getUrl={() => externalUrl} />}
        />
      )}
    </form.AppField>
  );
};
