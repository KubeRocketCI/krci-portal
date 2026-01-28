import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageChatAssistantForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const ApiUrl = () => {
  const form = useManageChatAssistantForm();
  const { mode, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.API_URL}>
      {(field) => (
        <field.FormTextField
          label="API URL"
          tooltipText="Enter Chat Assistant API URL."
          placeholder="Enter URL"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
