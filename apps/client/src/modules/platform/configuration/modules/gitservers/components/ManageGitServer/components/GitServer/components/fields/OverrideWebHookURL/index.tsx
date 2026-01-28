import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";

export const OverrideWebhookURL = () => {
  const form = useManageGitServerForm();

  return (
    <form.AppField name={NAMES.OVERRIDE_WEBHOOK_URL}>
      {(field) => (
        <field.FormSwitch
          label="Override Webhook URL"
          helperText="If enabled, the override Webhook URL will be used instead of the default one."
        />
      )}
    </form.AppField>
  );
};
