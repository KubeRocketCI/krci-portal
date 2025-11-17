import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { FORM_MODES } from "@/core/types/forms";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { CREDENTIALS_FORM_NAMES } from "../../../../../names";
import { useDataContext } from "../../../../../providers/Data/hooks";

export const SSHPublicKey = () => {
  const { gitServerSecret } = useDataContext();

  const {
    forms: { credentials: credentialsForm },
  } = useFormsContext();

  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <FormTextFieldPassword
      {...credentialsForm.form.register(CREDENTIALS_FORM_NAMES.SSH_PUBLIC_KEY, {
        required: "Paste your public SSH key.",
      })}
      label={"Public SSH key"}
      tooltipText={
        "Paste your public SSH key corresponding to the private key provided. Register this key on your Git server."
      }
      placeholder={"ssh-rsa PUBLIC KEY"}
      control={credentialsForm.form.control}
      errors={credentialsForm.form.formState.errors}
      helperText={
        gitServerSecretOwnerReference ? `This field value is managed by ${gitServerSecretOwnerReference}` : undefined
      }
      disabled={credentialsForm.mode === FORM_MODES.EDIT && !!gitServerSecretOwnerReference}
    />
  );
};
