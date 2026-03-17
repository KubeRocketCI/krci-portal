import React from "react";
import { NAMES } from "../../../../../constants";
import { useEditGitServerForm } from "../../../../../providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const SSHPublicKey: React.FC<{ ownerReference: string | undefined }> = ({ ownerReference }) => {
  const form = useEditGitServerForm();

  return (
    <form.AppField name={NAMES.SSH_PUBLIC_KEY}>
      {(field) => (
        <field.FormTextareaPassword
          label="Public SSH key"
          tooltipText="Paste your public SSH key for Gerrit."
          placeholder="ssh-rsa AAAA..."
          rows={4}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
