import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { useTabsContext } from "@/core/providers/Tabs/hooks";

export const TaskRunStep = ({ tabs }: { tabs: Tab[] }) => {
  const { activeTab, handleChangeTab } = useTabsContext();

  return <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />;
};
