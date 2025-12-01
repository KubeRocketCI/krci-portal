import React from "react";
import { FormTextarea } from "@/core/providers/Form/components/FormTextarea";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const DescriptionField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext();

  const typeFieldValue = watch(NAMES.type);

  return (
    <FormTextarea
      {...register(NAMES.description)}
      label={"Description"}
      tooltipText={"Add a brief description highlighting key features or functionality."}
      placeholder={typeFieldValue ? `Enter ${typeFieldValue} description` : "Enter description"}
      control={control}
      errors={errors}
      helperText="Help others understand what this project does."
    />
  );
};
