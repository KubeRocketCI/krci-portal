import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const Private: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField name={NAMES.private}>
      {(field) => (
        <field.FormSwitch
          label="Private"
          helperText="Leave checked to create a private repository with restricted access (default). Uncheck for a public repository."
          rich
          variant="list"
        />
      )}
    </form.AppField>
  );
};
