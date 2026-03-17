import React from "react";
import { NAMES } from "../../../../../constants";
import { useEditGitServerForm } from "../../../../../providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const Token: React.FC<{ ownerReference: string | undefined }> = ({ ownerReference }) => {
  const form = useEditGitServerForm();

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide the token for Git server authentication."
          placeholder="Enter token"
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
