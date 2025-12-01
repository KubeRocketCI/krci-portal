import React from "react";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const DefaultBranchField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormTextField
      {...register(NAMES.defaultBranch)}
      label="Default branch"
      tooltipText="Set the default branch for your repository (e.g., main, master). This branch is typically used as the base for new development and integration work."
      placeholder="Enter the default branch name"
      control={control}
      errors={errors}
    />
  );
};
