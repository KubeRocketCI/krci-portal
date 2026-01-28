import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const EmptyProject: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField name={NAMES.emptyProject}>
      {(field) => (
        <field.FormSwitch
          label="Empty project"
          helperText="An empty project does not contain any template code. However, KubeRocketCI pipelines and deployment templates will be created"
          rich
          variant="list"
        />
      )}
    </form.AppField>
  );
};
