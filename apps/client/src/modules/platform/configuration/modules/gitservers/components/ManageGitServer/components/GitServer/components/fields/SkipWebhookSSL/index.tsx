import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { GIT_SERVER_FORM_NAMES } from "../../../../../names";

export const SkipWebHookSSL = () => {
  const {
    forms: { gitServer: gitServerForm },
  } = useFormsContext();

  return (
    <FormCheckbox
      {...gitServerForm.form.register(GIT_SERVER_FORM_NAMES.SKIP_WEBHOOK_SSL)}
      label={
        <FormControlLabelWithTooltip
          label={"Skip Webhook SSL Verification"}
          title="If enabled, the webhook SSL verification will be skipped."
        />
      }
      control={gitServerForm.form.control}
      errors={gitServerForm.form.formState.errors}
    />
  );
};
