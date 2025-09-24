import { useFormsContext } from "../../../../hooks/useFormsContext";
import { INTEGRATION_SECRET_FORM_NAMES, QUICK_LINK_FORM_NAMES } from "../../../../constants";
import { useDataContext } from "../../../../providers/Data/hooks";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FORM_MODES } from "@/core/types/forms";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

export const ExternalURL = () => {
  const {
    forms: {
      secret,
      quickLink: {
        form: {
          register,
          control,
          formState: { errors },
        },
      },
    },
  } = useFormsContext();

  const { quickLink, mode } = useDataContext();

  return (
    <FormTextField
      {...register(QUICK_LINK_FORM_NAMES.EXTERNAL_URL, {
        required: "Enter the external Dependency Track URL.",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS),
          message: "Enter a valid URL with HTTPS protocol.",
        },
        onChange: ({ target: { value } }) => {
          if (mode === FORM_MODES.EDIT) {
            return;
          }

          secret.form.setValue(INTEGRATION_SECRET_FORM_NAMES.URL, value);
        },
      })}
      label={"Quick Link URL"}
      tooltipText={"Enter the external URL of your Dependency Track instance."}
      placeholder={"Enter URL"}
      control={control}
      errors={errors}
      disabled={!quickLink}
    />
  );
};
