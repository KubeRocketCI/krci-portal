import React from "react";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const NameField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormTextField
      {...register(NAMES.name)}
      label={`Component name`}
      tooltipText={"Provide a clear and concise name for your component."}
      placeholder={`Enter the Component name`}
      control={control}
      errors={errors}
      helperText="Internal identifier for the project (auto-filled from repository name)"
    />
  );
};
