import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { mapObjectValuesToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { codebaseTestReportFramework } from "@my-project/shared";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const TestReportFramework = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormSelect
      {...register(CODEBASE_FORM_NAMES.testReportFramework.name, {
        required: "Select autotest report framework",
      })}
      label={"Autotest report framework"}
      control={control}
      errors={errors}
      options={mapObjectValuesToSelectOptions(codebaseTestReportFramework)}
    />
  );
};
