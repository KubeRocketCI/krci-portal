import React from "react";
import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const EmptyProjectField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormSwitchRich
      {...register(NAMES.emptyProject)}
      label="Empty project"
      helperText="An empty project does not contain any template code. However, KubeRocketCI pipelines and deployment templates will be created"
      control={control}
      errors={errors}
    />
  );
};

