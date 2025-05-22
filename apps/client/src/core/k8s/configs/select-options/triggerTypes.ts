import { TRIGGER_TYPE } from "../../constants/triggerTypes";
import { SelectOption } from "@/core/providers/Form/types";

export const triggerTypeSelectOptions: SelectOption[] = [
  TRIGGER_TYPE.MANUAL,
  TRIGGER_TYPE.AUTO,
  TRIGGER_TYPE.AUTO_STABLE,
].map((value) => ({
  label: value,
  value,
}));
