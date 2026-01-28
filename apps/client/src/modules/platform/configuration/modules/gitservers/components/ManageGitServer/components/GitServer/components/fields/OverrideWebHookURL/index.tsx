import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";

export const OverrideWebhookURL = () => {
  const form = useManageGitServerForm();
  const overrideWebhookURL = useStore(form.store, (state) => state.values[NAMES.OVERRIDE_WEBHOOK_URL]);

  return (
    <form.AppField name={NAMES.OVERRIDE_WEBHOOK_URL}>
      {(field) => (
        <field.FormSwitch
          label="Override Webhook URL"
          helperText="If enabled, the override Webhook URL will be used instead of the default one."
          rich
          expandableContent={
            overrideWebhookURL ? (
              <form.AppField name={NAMES.WEBHOOK_URL}>
                {(webhookField) => (
                  <webhookField.FormTextField
                    label="Webhook URL"
                    tooltipText="URL for Git server event notifications like push operations. Must be accessible from the Git Server's network."
                    placeholder="https://example.com"
                  />
                )}
              </form.AppField>
            ) : null
          }
        />
      )}
    </form.AppField>
  );
};
