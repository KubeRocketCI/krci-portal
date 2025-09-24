import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { CODEMIE_FORM_NAMES } from "../../../../constants";

export const ApiUrl = () => {
  const {
    forms: { codemie },
  } = useFormsContext();

  return (
    <FormTextField
      {...codemie.form.register(CODEMIE_FORM_NAMES.API_URL)}
      label={"API URL"}
      tooltipText={"Enter the API URL for your CodeMie instance."}
      placeholder={"Enter API URL"}
      control={codemie.form.control}
      errors={codemie.form.formState.errors}
    />
  );
};
