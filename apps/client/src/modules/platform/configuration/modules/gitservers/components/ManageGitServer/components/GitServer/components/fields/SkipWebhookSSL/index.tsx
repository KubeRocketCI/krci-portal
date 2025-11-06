import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { GIT_SERVER_FORM_NAMES } from "../../../../../names";

export const SkipWebHookSSL = () => {
  const {
    forms: { gitServer: gitServerForm },
  } = useFormsContext();

  return (
    <FormSwitchRich
      {...gitServerForm.form.register(GIT_SERVER_FORM_NAMES.SKIP_WEBHOOK_SSL)}
      label="Skip Webhook SSL Verification"
      helperText="If enabled, the webhook SSL verification will be skipped."
      control={gitServerForm.form.control}
      errors={gitServerForm.form.formState.errors}
    />
  );
};
