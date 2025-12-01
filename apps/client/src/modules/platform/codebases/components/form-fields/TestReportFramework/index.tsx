import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { mapObjectValuesToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { codebaseTestReportFramework } from "@my-project/shared";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const TestReportFrameworkField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormSelect
      {...register(NAMES.testReportFramework)}
      label={"Autotest report framework"}
      control={control}
      errors={errors}
      options={mapObjectValuesToSelectOptions(codebaseTestReportFramework)}
    />
  );
};
