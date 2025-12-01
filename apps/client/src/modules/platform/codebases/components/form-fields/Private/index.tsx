import React from "react";
import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const PrivateField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormSwitchRich
      {...register(NAMES.private)}
      label="Private"
      helperText="Leave checked to create a private repository with restricted access (default). Uncheck for a public repository."
      control={control}
      errors={errors}
    />
  );
};

