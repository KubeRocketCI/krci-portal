import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/stages/create/components/CreateStageWizard/names";
import { FieldEvent } from "@/core/types/forms";

const nameRequirementLabel = `Name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces`;

export interface StageNameFieldProps {
  otherStagesNames?: string[];
  cdPipelineName?: string;
  namespace?: string;
}

export const StageNameField: React.FC<StageNameFieldProps> = ({ otherStagesNames = [], cdPipelineName, namespace }) => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext();

  return (
    <FormTextField
      {...register(NAMES.name, {
        required: `Enter an Environment name. `,
        pattern: {
          value: /^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/,
          message: nameRequirementLabel,
        },
        onChange: ({ target: { value } }: FieldEvent) => {
          if (namespace && cdPipelineName) {
            setValue(NAMES.deployNamespace, `${namespace}-${cdPipelineName}-${value}`);
          }
        },
        validate: (name) => {
          if (otherStagesNames.includes(name)) {
            return `"${name}" has been already added to the Environments that will be created`;
          }
        },
        maxLength: { value: 10, message: "Name must be not more than 10 characters long" },
      })}
      label={"Environment name"}
      tooltipText={
        "Specify an environment name. This name identifies the specific environment within your Deployment Flow."
      }
      placeholder={"Enter an Environment name"}
      control={control}
      errors={errors}
    />
  );
};
