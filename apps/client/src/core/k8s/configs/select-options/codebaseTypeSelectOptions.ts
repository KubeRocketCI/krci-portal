import { SelectOption } from "@/core/providers/Form/types";
import { CODEBASE_TYPE } from "../../constants/codebaseTypes";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";

export const codebaseTypeSelectOptions: SelectOption[] = [
  CODEBASE_TYPE.ALL,
  CODEBASE_TYPE.APPLICATION,
  CODEBASE_TYPE.AUTOTEST,
  CODEBASE_TYPE.INFRASTRUCTURE,
  CODEBASE_TYPE.LIBRARY,
].map((value) => ({
  label: capitalizeFirstLetter(value),
  value,
}));
