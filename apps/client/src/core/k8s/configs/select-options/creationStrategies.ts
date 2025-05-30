import { SelectOption } from "@/core/providers/Form/types";
import { mapArrayToSelectOptions, mapObjectValuesToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { codebaseCreationStrategy, codebaseType } from "@my-project/shared";

export const getCreationStrategySelectOptionsByCodebaseType = (type: string): SelectOption[] => {
  switch (type) {
    case codebaseType.application:
    case codebaseType.library:
      return mapObjectValuesToSelectOptions(codebaseCreationStrategy);

    case codebaseType.autotest:
      return mapArrayToSelectOptions([codebaseCreationStrategy.clone, codebaseCreationStrategy.import]);
    default:
      return [];
  }
};
