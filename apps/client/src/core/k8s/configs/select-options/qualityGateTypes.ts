import { QUALITY_GATE_TYPE } from "../../constants/qualityGateTypes";
import { SelectOption } from "@/core/providers/Form/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";

export const qualityGateTypeSelectOptions: SelectOption[] = [QUALITY_GATE_TYPE.MANUAL, QUALITY_GATE_TYPE.AUTOTESTS].map(
  (value) => ({
    label: capitalizeFirstLetter(value),
    value,
  })
);
