import { useFormsContext } from "../../../../hooks/useFormsContext";
import { QUICK_LINK_FORM_NAMES } from "../../../../constants";
import { useDataContext } from "../../../../providers/Data/hooks";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

export const ExternalURL = () => {
  const {
    forms: {
      quickLink: {
        form: {
          register,
          control,
          formState: { errors },
        },
      },
    },
  } = useFormsContext();

  const { quickLink } = useDataContext();

  return (
    <FormTextField
      {...register(QUICK_LINK_FORM_NAMES.EXTERNAL_URL, {
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS),
          message: "Enter a valid URL with HTTPS protocol.",
        },
      })}
      label={"Quick Link URL"}
      tooltipText={"Enter the external URL of your CodeMie instance."}
      placeholder={"Enter URL"}
      control={control}
      errors={errors}
      disabled={!quickLink}
    />
  );
};
