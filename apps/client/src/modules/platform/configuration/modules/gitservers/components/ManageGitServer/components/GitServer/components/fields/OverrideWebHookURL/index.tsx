import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { GIT_SERVER_FORM_NAMES } from "../../../../../names";

export const OverrideWebhookURL = () => {
  const {
    forms: { gitServer: gitServerForm },
  } = useFormsContext();

  return (
    <FormSwitchRich
      {...gitServerForm.form.register(GIT_SERVER_FORM_NAMES.OVERRIDE_WEBHOOK_URL)}
      label="Override Webhook URL"
      helperText="If enabled, the override Webhook URL will be used instead of the default one."
      control={gitServerForm.form.control}
      errors={gitServerForm.form.formState.errors}
    />
  );
};
