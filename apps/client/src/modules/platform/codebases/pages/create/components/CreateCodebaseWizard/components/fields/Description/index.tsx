import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const Description: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.description}
      validators={{
        onChange: ({ value }) => {
          if (!value || value.trim().length === 0) return "Enter component description";
          return undefined;
        },
      }}
    >
      {(field) => <field.FormTextarea label="Description" placeholder="Enter component description" rows={3} />}
    </form.AppField>
  );
};
