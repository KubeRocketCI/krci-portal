import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";

export const SSHPublicKey = () => {
  const form = useCreateGitServerForm();

  return (
    <form.AppField name={NAMES.SSH_PUBLIC_KEY}>
      {(field) => (
        <field.FormTextareaPassword
          label="Public SSH key"
          tooltipText="Paste your public SSH key for Gerrit."
          placeholder="ssh-rsa AAAA..."
          rows={4}
        />
      )}
    </form.AppField>
  );
};
