import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const CodebaseAuthField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormSwitchRich
      {...register(NAMES.ui_hasCodebaseAuth)}
      label="Repository credentials"
      control={control}
      errors={errors}
    />
  );
};
