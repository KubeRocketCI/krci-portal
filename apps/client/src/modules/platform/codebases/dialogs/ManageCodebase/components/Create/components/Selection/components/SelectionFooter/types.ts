import { ValueOf } from "@/core/types/global";
import { mainTabs } from "@/modules/platform/codebases/dialogs/ManageCodebase/constants";

export interface SelectionFooterProps {
  setActiveTab: React.Dispatch<React.SetStateAction<ValueOf<typeof mainTabs>>>;
}
