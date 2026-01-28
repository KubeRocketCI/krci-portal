import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageChatAssistantForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const AssistantId = () => {
  const form = useManageChatAssistantForm();
  const { mode, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.ASSISTANT_ID}>
      {(field) => (
        <field.FormTextField
          label="Assistant ID"
          tooltipText="Enter the Assistant ID for your Chat Assistant instance."
          placeholder="Enter Assistant ID"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
