import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { FORM_MODES } from "@/core/types/forms";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { CREDENTIALS_FORM_NAMES } from "../../../../../names";
import { useDataContext } from "../../../../../providers/Data/hooks";

export const Token = () => {
  const { gitServerSecret } = useDataContext();

  const {
    forms: { credentials: credentialsForm },
  } = useFormsContext();

  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <FormTextFieldPassword
      {...credentialsForm.form.register(CREDENTIALS_FORM_NAMES.TOKEN, {
        required: "Enter your access token",
      })}
      label={"Access token"}
      control={credentialsForm.form.control}
      errors={credentialsForm.form.formState.errors}
      disabled={credentialsForm.mode === FORM_MODES.EDIT && !!gitServerSecretOwnerReference}
    />
  );
};
