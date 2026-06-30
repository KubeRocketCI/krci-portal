import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { isGerritProvider } from "../../../utils";

export const GitUrlPath: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.gitUrlPath}
      validators={{
        onChange: ({ value, fieldApi }) => {
          const isGerrit = isGerritProvider(fieldApi.form.getFieldValue(NAMES.ui_gitServerProvider));
          if (!isGerrit) {
            return undefined;
          }
          if (!value || value.length < 3) {
            return "Repository name has to be at least 3 characters long.";
          }
          return undefined;
        },
      }}
    >
      {(field) => <field.FormTextField label="Git URL Path" placeholder="Enter repository path" />}
    </form.AppField>
  );
};
