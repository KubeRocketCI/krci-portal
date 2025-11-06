import { FormTextarea } from "@/core/providers/Form/components/FormTextarea";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CDPIPELINE_FORM_NAMES } from "../../../names";

export const Description = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormTextarea
      {...register(CDPIPELINE_FORM_NAMES.description.name, {
        required: "Description is required",
      })}
      label={"Description"}
      tooltipText={"Enter Created Deployment Flow Description"}
      placeholder={"Enter description"}
      control={control}
      errors={errors}
      rows={4}
    />
  );
};
