import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export interface RepositoryUrlProps {
  disabled?: boolean;
}

export const RepositoryUrl: React.FC<RepositoryUrlProps> = ({ disabled }) => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.repositoryUrl}
      validators={{
        onChange: ({ value }) => {
          if (!value) return undefined;
          const urlPattern = /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)[\w.@/~-]+\w/;
          if (!urlPattern.test(value)) {
            return "Specify the application URL in the following format: http(s)://git.example.com/example.";
          }
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Repository URL"
          placeholder="http(s)://git.example.com/example"
          disabled={disabled}
        />
      )}
    </form.AppField>
  );
};
