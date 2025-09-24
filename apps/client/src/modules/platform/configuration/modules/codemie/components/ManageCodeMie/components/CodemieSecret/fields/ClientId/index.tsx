import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { CODEMIE_SECRET_FORM_NAMES } from "../../../../constants";

export const ClientId = () => {
  const {
    forms: { codemieSecret },
  } = useFormsContext();

  return (
    <FormTextField
      {...codemieSecret.form.register(CODEMIE_SECRET_FORM_NAMES.CLIENT_ID)}
      label={"Client ID"}
      tooltipText={"Enter the Client ID for your CodeMie OAuth application."}
      placeholder={"Enter Client ID"}
      control={codemieSecret.form.control}
      errors={codemieSecret.form.formState.errors}
    />
  );
};
