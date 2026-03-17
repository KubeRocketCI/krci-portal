import { NAMES } from "../../../constants";
import { useCreateJiraForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const URL = () => {
  const form = useCreateJiraForm();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Provide the base URL of your Jira instance without any specific paths or endpoints (e.g., https://your-jira-instance.com)."
          placeholder="Enter Jira URL"
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
