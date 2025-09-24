import { FORM_MODES } from "@/core/types/forms";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { CREDENTIALS_FORM_NAMES } from "../../../../../names";
import { useDataContext } from "../../../../../providers/Data/hooks";
import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";

export const SSHPrivateKey = () => {
  const { gitServerSecret } = useDataContext();

  const {
    forms: { credentials: credentialsForm },
  } = useFormsContext();

  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <FormTextFieldPassword
      {...credentialsForm.form.register(CREDENTIALS_FORM_NAMES.SSH_PRIVATE_KEY, {
        required: "Paste your private SSH key for authentication.",
      })}
      label={"Private SSH key"}
      tooltipText={
        "Paste your private SSH key for secure authentication. Ensure it corresponds to the public key registered on your Git server."
      }
      placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\n"}
      control={credentialsForm.form.control}
      errors={credentialsForm.form.formState.errors}
      TextFieldProps={{
        multiline: true,
        minRows: 6,
        maxRows: 6,
        helperText: gitServerSecretOwnerReference && `This field value is managed by ${gitServerSecretOwnerReference}`,
      }}
      disabled={credentialsForm.mode === FORM_MODES.EDIT && !!gitServerSecretOwnerReference}
    />
  );
};
