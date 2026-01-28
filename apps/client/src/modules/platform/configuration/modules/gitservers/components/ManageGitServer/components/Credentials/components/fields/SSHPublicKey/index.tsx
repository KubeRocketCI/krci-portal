import { NAMES } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/names";
import { useManageGitServerForm } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/providers/form/hooks";
import { useDataContext } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/providers/Data/hooks";

export const SSHPublicKey = () => {
  const form = useManageGitServerForm();
  const { gitServerSecret } = useDataContext();
  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <form.AppField name={NAMES.SSH_PUBLIC_KEY}>
      {(field) => (
        <field.FormTextareaPassword
          label="Public SSH key"
          tooltipText="Paste your public SSH key for Gerrit."
          placeholder="ssh-rsa AAAA..."
          rows={4}
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
