import React from "react";
import { STAGE_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { StageNameProps } from "./types";
import { useStageForm } from "../../../providers/form/hooks";

const nameRequirementLabel = `Name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces`;

export const StageName = ({ otherStagesNames }: StageNameProps) => {
  const form = useStageForm();

  const {
    props: { cdPipeline },
  } = useCurrentDialog();

  const namespace = cdPipeline?.metadata.namespace;
  const CDPipelineName = cdPipeline?.metadata.name;

  const handleNameChange = React.useCallback(
    (value: string) => {
      form.setFieldValue(STAGE_FORM_NAMES.deployNamespace.name, `${namespace}-${CDPipelineName}-${value}`);
    },
    [form, namespace, CDPipelineName]
  );

  return (
    <form.AppField
      name={STAGE_FORM_NAMES.name.name}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter an Environment name.";
          if (!/^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/.test(value)) {
            return nameRequirementLabel;
          }
          if (value.length > 10) {
            return "Name must be not more than 10 characters long";
          }
          if (otherStagesNames.includes(value)) {
            return `"${value}" has been already added to the Environments that will be created`;
          }
          return undefined;
        },
      }}
      listeners={{
        onChange: ({ value }) => handleNameChange(value as string),
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Environment name"
          tooltipText="Specify an environment name. This name identifies the specific environment within your Deployment Flow."
          placeholder="Enter an Environment name"
        />
      )}
    </form.AppField>
  );
};
