import React from "react";
import z from "zod";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const DefaultBranch: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.defaultBranch}
      validators={{
        onChange: z
          .string()
          .min(1, "Specify a branch to work in.")
          .regex(/^[a-z0-9][a-z0-9/\-.]*[a-z0-9]$/, "Enter valid default branch name"),
      }}
    >
      {(field) => <field.FormTextField label="Default Branch" placeholder="main" />}
    </form.AppField>
  );
};
