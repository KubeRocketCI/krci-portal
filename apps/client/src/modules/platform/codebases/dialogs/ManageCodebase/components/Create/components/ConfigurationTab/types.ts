import { ValueOf } from "@/core/types/global";
import { mainTabs } from "@/modules/platform/codebases/dialogs/ManageCodebase/constants";
import { ManageCodebaseFormValues } from "@/modules/platform/codebases/dialogs/ManageCodebase/types";

export interface ConfigurationTabProps {
  setActiveTab: React.Dispatch<React.SetStateAction<ValueOf<typeof mainTabs>>>;
  baseDefaultValues: Partial<ManageCodebaseFormValues>;
}
