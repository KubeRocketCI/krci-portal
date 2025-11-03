import { ValueOf } from "@my-project/shared";
import { mainTabs } from "@/modules/platform/codebases/dialogs/ManageCodebase/constants";
export interface SelectionProps {
  setActiveTab: React.Dispatch<React.SetStateAction<ValueOf<typeof mainTabs>>>;
}
