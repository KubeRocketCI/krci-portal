import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const RepositoryPasswordOrApiTokenField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormTextFieldPassword
      {...register(NAMES.ui_repositoryPasswordOrApiToken)}
      label={"Repository password or access token"}
      placeholder={"Enter the repository password or access token"}
      control={control}
      errors={errors}
    />
  );
};
