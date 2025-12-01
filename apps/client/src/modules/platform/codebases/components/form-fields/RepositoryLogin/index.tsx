import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const RepositoryLoginField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormTextField
      {...register(NAMES.ui_repositoryLogin)}
      label={"Repository login"}
      placeholder={"Enter repository login"}
      control={control}
      errors={errors}
    />
  );
};
