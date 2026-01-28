import { NAMES } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/names";
import { useManageGitServerForm } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/providers/form/hooks";
import { useDataContext } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/providers/Data/hooks";

export const SSHPrivateKey = () => {
  const form = useManageGitServerForm();
  const { gitServerSecret } = useDataContext();
  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <form.AppField name={NAMES.SSH_PRIVATE_KEY}>
      {(field) => (
        <field.FormTextareaPassword
          label="Private SSH key"
          tooltipText="Paste your private SSH key for secure authentication. Ensure it corresponds to the public key registered on your Git server."
          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----\n"
          rows={6}
          helperText={
            gitServerSecretOwnerReference
              ? `This field value is managed by ${gitServerSecretOwnerReference}`
              : undefined
          }
          disabled={!!gitServerSecretOwnerReference}
        />
      )}
    </form.AppField>
  );
};
