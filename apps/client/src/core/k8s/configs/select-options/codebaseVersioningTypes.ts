import { SelectOption } from "@/core/providers/Form/types";
import { CODEBASE_VERSIONING_TYPE } from "../../constants/codebaseVersioningTypes";

export const codebaseVersioningTypeSelectOptions: SelectOption[] = [
  CODEBASE_VERSIONING_TYPE.DEFAULT,
  CODEBASE_VERSIONING_TYPE.SEMVER,
].map((value) => ({
  label: value,
  value,
}));
