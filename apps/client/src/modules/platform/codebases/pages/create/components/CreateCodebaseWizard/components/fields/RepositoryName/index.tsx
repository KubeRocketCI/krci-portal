import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const RepositoryName: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.ui_repositoryName}
      validators={{
        onChange: ({ value }) => {
          if (!value || value.trim().length === 0) return "Enter the repository name";
          if (value.length < 3) return "Repository name must be at least 3 characters long";
          return undefined;
        },
      }}
    >
      {(field) => <field.FormTextField label="Repository Name" placeholder="Enter repository name" />}
    </form.AppField>
  );
};
