import { ValueOf } from "@/core/types/global";
import { mainTabs } from "@/modules/platform/codebases/dialogs/ManageCodebase/constants";

export interface SelectionTabProps {
  setActiveTab: React.Dispatch<React.SetStateAction<ValueOf<typeof mainTabs>>>;
}

