import React from "react";
import { NAMES } from "../../../../../constants";
import { useEditGitServerForm } from "../../../../../providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const SSHPrivateKey: React.FC<{ ownerReference: string | undefined }> = ({ ownerReference }) => {
  const form = useEditGitServerForm();

  return (
    <form.AppField name={NAMES.SSH_PRIVATE_KEY}>
      {(field) => (
        <field.FormTextareaPassword
          label="Private SSH key"
          tooltipText="Paste your private SSH key for secure authentication. Ensure it corresponds to the public key registered on your Git server."
          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----\n"
          rows={6}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
