import { ValueOf } from "@/core/types/global";
import { applicationTableMode } from "./constants";
import { VALUES_OVERRIDE_POSTFIX, IMAGE_TAG_POSTFIX, ALL_VALUES_OVERRIDE_KEY } from "../../../../constants";

export type ApplicationsTableMode = ValueOf<typeof applicationTableMode>;

type ValuesOverrideFieldKey = `${string}${typeof VALUES_OVERRIDE_POSTFIX}`;
type ImageTagFieldKey = `${string}${typeof IMAGE_TAG_POSTFIX}`;
type DynamicFieldKey = ValuesOverrideFieldKey | ImageTagFieldKey;

export type ApplicationsFormValues = {
  [ALL_VALUES_OVERRIDE_KEY]: boolean;
} & {
  [K in DynamicFieldKey]: K extends ValuesOverrideFieldKey ? boolean : K extends ImageTagFieldKey ? string : never;
};