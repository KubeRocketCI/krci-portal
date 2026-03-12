import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";

export const WebHookURL = () => {
  const form = useManageGitServerForm();
  const overrideWebhookURL = useStore(form.store, (state) => state.values[NAMES.OVERRIDE_WEBHOOK_URL]);
  const webhookURL = useStore(form.store, (state) => state.values[NAMES.WEBHOOK_URL]);

  return (
    <form.AppField name={NAMES.WEBHOOK_URL}>
      {(field) => (
        <field.FormTextField
          label="Webhook URL"
          tooltipText="URL for Git server event notifications like push operations. Must be accessible from the Git Server's network."
          placeholder="https://example.com"
          disabled={!overrideWebhookURL}
          suffix={<CopyToClipboardButton getValue={() => webhookURL || ""} />}
        />
      )}
    </form.AppField>
  );
};
