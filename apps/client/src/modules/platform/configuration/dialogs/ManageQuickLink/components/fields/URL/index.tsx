import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { QUICK_LINK_FORM_NAMES } from "../../../names";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";

export const URL = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormTextField
      {...register(QUICK_LINK_FORM_NAMES.url.name, {
        required: "Enter service endpoint URL.",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS),
          message: "Enter a valid URL with HTTP/HTTPS protocol.",
        },
      })}
      label={"URL"}
      tooltipText="Specify the full URL including the protocol (e.g., https://example.com). This is the destination users will be redirected to when clicking the link."
      placeholder={"https://example.com"}
      control={control}
      errors={errors}
    />
  );
};
