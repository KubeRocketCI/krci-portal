import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageDefectDojoForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { OpenExternalLinkButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const ExternalURL = () => {
  const form = useManageDefectDojoForm();
  const { quickLink, mode } = useDataContext();
  const externalUrl = useStore(form.store, (state) => state.values[NAMES.EXTERNAL_URL]);

  return (
    <form.AppField
      name={NAMES.EXTERNAL_URL}
      listeners={{
        onChange: ({ value }) => {
          if (mode === FORM_MODES.CREATE) form.setFieldValue(NAMES.URL, value);
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Quick Link URL"
          tooltipText="Enter the external URL of your DefectDojo instance."
          placeholder="Enter URL"
          disabled={!quickLink}
          suffix={<OpenExternalLinkButton getUrl={() => externalUrl} />}
        />
      )}
    </form.AppField>
  );
};
