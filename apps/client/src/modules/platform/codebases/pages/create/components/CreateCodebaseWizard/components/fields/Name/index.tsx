import React from "react";
import z from "zod";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const Name: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.name}
      validators={{
        onChange: z
          .string()
          .min(2, "Component name must be not less than two characters long.")
          .max(30, "Component name must be less than 30 characters long.")
          .regex(/^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/, {
            message:
              "Component name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces",
          }),
      }}
    >
      {(field) => <field.FormTextField label="Component Name" placeholder="Enter component name" />}
    </form.AppField>
  );
};
