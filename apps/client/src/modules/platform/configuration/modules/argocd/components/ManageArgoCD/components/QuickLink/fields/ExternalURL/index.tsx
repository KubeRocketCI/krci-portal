import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageArgoCDForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const ExternalURL = () => {
  const form = useManageArgoCDForm();
  const { quickLink, mode } = useDataContext();

  return (
    <form.AppField
      name={NAMES.EXTERNAL_URL}
      listeners={{
        // In create mode, sync externalUrl to secret.url field
        onChange: ({ value }) => {
          if (mode === FORM_MODES.CREATE) {
            form.setFieldValue(NAMES.URL, value);
          }
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Quick Link URL"
          tooltipText="Enter the external URL of your Argo CD instance."
          placeholder="Enter URL"
          disabled={!quickLink}
        />
      )}
    </form.AppField>
  );
};
