import { useDetailTabs } from "@/modules/platform/tekton/hooks/useDetailTabs";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { Overview } from "../components/Overview";
import { UsedBy } from "../components/UsedBy";
import { ViewYaml } from "../components/ViewYaml";
import { routeTriggerDetails, PATH_TRIGGER_DETAILS_FULL } from "../route";

export const useTabs = (): Tab[] =>
  useDetailTabs({
    route: routeTriggerDetails,
    path: PATH_TRIGGER_DETAILS_FULL,
    Overview,
    UsedBy,
    ViewYaml,
  });
