import React from "react";
import { NAMES } from "../../../../../constants";
import { useEditGitServerForm } from "../../../../../providers/form/hooks";

export const UserName: React.FC<{ ownerReference: string | undefined }> = ({ ownerReference }) => {
  const form = useEditGitServerForm();

  return (
    <form.AppField name={NAMES.GIT_USER}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Provide the username associated with your Git account."
          placeholder="git"
          disabled={!!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
