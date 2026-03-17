import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";

export const SkipWebHookSSL = () => {
  const form = useCreateGitServerForm();

  return (
    <form.AppField name={NAMES.SKIP_WEBHOOK_SSL}>
      {(field) => (
        <field.FormSwitch
          label="Skip Webhook SSL Verification"
          helperText="If enabled, the webhook SSL verification will be skipped."
          rich
        />
      )}
    </form.AppField>
  );
};
