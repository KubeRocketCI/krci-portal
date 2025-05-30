import { SelectOption } from "@/core/types/forms";

export const mapArrayToSelectOptions = <Value extends string>(array: Value[]): SelectOption<Value>[] => {
  return array.map((item) => ({
    label: item,
    value: item,
  }));
};

export const mapObjectValuesToSelectOptions = <Value extends string>(
  object: Record<string, Value>
): SelectOption<Value>[] => {
  return Object.values(object).map((item) => ({
    label: item,
    value: item,
  }));
};
