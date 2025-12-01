import React from "react";
import { useFormContext } from "react-hook-form";
import { CreateCDPipelineFormValues, NAMES } from "../../names";
import { FieldEvent } from "@/core/types/forms";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FormTextarea } from "@/core/providers/Form/components/FormTextarea";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { cdPipelineDeploymentType } from "@my-project/shared";

export const PipelineConfiguration: React.FC = () => {
  const {
    register,
    formState: { errors },
    control,
    getValues,
    setValue,
  } = useFormContext<CreateCDPipelineFormValues>();

  const deploymentTypeOptions = React.useMemo(
    () => [
      { label: "Container", value: cdPipelineDeploymentType.container },
      { label: "Custom", value: cdPipelineDeploymentType.custom },
    ],
    []
  );

  const nameRequirementLabel = `Name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces`;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormTextField
          {...register(NAMES.name, {
            required: `The pipeline name must be at least 2 characters long and can only include lowercase letters, numbers, and dashes. It should not start or end with a dash or dot. E.g. my-java-application-1`,
            pattern: {
              value: /^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/,
              message: nameRequirementLabel,
            },
            maxLength: { value: 15, message: "Name must be not more than 15 characters long" },
          })}
          label={"Pipeline name"}
          tooltipText={"Enter a unique and descriptive name for your deployment pipeline."}
          placeholder={"Enter pipeline name"}
          control={control}
          errors={errors}
        />

        <FormTextarea
          {...register(NAMES.description, {
            required: "Description is required",
          })}
          label={"Description"}
          tooltipText={"Add a brief description highlighting key features or functionality."}
          placeholder={"Enter description"}
          control={control}
          errors={errors}
          helperText="Help others understand what this deployment flow does."
        />

        <FormCombobox
          {...register(NAMES.deploymentType)}
          label={"Deployment Type"}
          tooltipText={"Select the deployment type for this pipeline"}
          placeholder={"Select deployment type"}
          control={control}
          errors={errors}
          options={deploymentTypeOptions}
        />
      </div>

      {/* Promote Applications Switch */}
      <div className="w-full">
        <FormSwitchRich
          {...register(NAMES.ui_applicationsToPromoteAll, {
            onChange: ({ target: { value } }: FieldEvent) => {
              const values = getValues();

              setValue(NAMES.applicationsToPromote, value ? values.ui_applicationsToAddChooser || [] : []);
            },
          })}
          label="Promote applications"
          helperText="Enables the promotion of applications to the higher environment upon the successful pass through all quality gates."
          labelPlacement="start"
          control={control}
          errors={errors}
        />
      </div>
    </div>
  );
};
