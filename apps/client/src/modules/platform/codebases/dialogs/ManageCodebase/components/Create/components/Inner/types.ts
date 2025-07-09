import { ValueOf } from "@/core/types/global";
import { mainTabs } from "../../../../constants";
import { ManageCodebaseFormValues } from "../../../../types";

export interface ConfigurationProps {
  setActiveTab: React.Dispatch<React.SetStateAction<ValueOf<typeof mainTabs>>>;
  baseDefaultValues: Partial<ManageCodebaseFormValues>;
}
