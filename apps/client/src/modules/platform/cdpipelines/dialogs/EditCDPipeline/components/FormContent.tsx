import React from "react";
import { NAMES } from "../../../pages/create/components/CreateCDPipelineWizard/names";
import { useFormContext } from "react-hook-form";
import { FormTextarea } from "@/core/providers/Form/components/FormTextarea";

export const FormContent: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
};
