import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";

export const SSHPrivateKey = () => {
  const form = useCreateGitServerForm();

  return (
    <form.AppField name={NAMES.SSH_PRIVATE_KEY}>
      {(field) => (
        <field.FormTextareaPassword
          label="Private SSH key"
          tooltipText="Paste your private SSH key for secure authentication. Ensure it corresponds to the public key registered on your Git server."
          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----\n"
          rows={6}
        />
      )}
    </form.AppField>
  );
};
