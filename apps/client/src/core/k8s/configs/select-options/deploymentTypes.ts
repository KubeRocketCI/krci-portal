import { DEPLOYMENT_TYPE } from "../../constants/deploymentTypes";
import { SelectOption } from "@/core/providers/Form/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";

export const deploymentTypeSelectOptions: SelectOption[] = [DEPLOYMENT_TYPE.CONTAINER, DEPLOYMENT_TYPE.CUSTOM].map(
  (value) => ({
    label: capitalizeFirstLetter(value),
    value,
  })
);
