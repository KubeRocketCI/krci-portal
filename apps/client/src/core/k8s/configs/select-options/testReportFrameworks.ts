import { TEST_REPORT_FRAMEWORK } from "../../constants/testReportFrameworks";
import { SelectOption } from "@/core/providers/Form/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";

export const testReportFrameworkSelectOptions: SelectOption[] = [TEST_REPORT_FRAMEWORK.ALLURE].map((value) => ({
  label: capitalizeFirstLetter(value),
  value,
}));
