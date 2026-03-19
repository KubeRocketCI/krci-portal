import { NAMES } from "../../../constants";
import { useEditSonarForm } from "../../../providers/form/hooks";
import { OpenExternalLinkButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const ExternalURL = ({ disabled }: { disabled?: boolean }) => {
  const form = useEditSonarForm();
  const externalUrl = useStore(form.store, (state) => state.values[NAMES.EXTERNAL_URL]);

  return (
    <form.AppField name={NAMES.EXTERNAL_URL}>
      {(field) => (
        <field.FormTextField
          label="Quick Link URL"
          tooltipText="Enter the external URL of your SonarQube instance."
          placeholder="Enter URL"
          suffix={<OpenExternalLinkButton getUrl={() => externalUrl} />}
          disabled={disabled}
        />
      )}
    </form.AppField>
  );
};
