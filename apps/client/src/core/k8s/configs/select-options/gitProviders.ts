import { GIT_PROVIDER } from "../../constants/gitProviders";
import { SelectOption } from "@/core/providers/Form/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";

export const gitProviderOptions: SelectOption[] = [
  GIT_PROVIDER.GERRIT,
  GIT_PROVIDER.GITLAB,
  GIT_PROVIDER.GITHUB,
  GIT_PROVIDER.BITBUCKET,
].map((value) => ({
  label: capitalizeFirstLetter(value),
  value,
}));
