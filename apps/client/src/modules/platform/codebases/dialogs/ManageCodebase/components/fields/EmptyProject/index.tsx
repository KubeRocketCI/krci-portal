import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const EmptyProject = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormSwitchRich
      {...register(CODEBASE_FORM_NAMES.emptyProject.name)}
      label="Empty project"
      helperText="An empty project does not contain any template code. However, KubeRocketCI pipelines and deployment templates will be created"
      control={control}
      errors={errors}
    />
  );
};
