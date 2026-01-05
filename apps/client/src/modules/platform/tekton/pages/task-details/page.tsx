import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { tabNameToIndexMap } from "./constants";
import { routeTaskDetails } from "./route";
import TaskDetailsPageContent from "./view";

export default function TaskDetailsPage() {
  const search = routeTaskDetails.useSearch();
  const initialTabIdx = search.tab ? tabNameToIndexMap[search.tab] : 0;

  return (
    <TabsContextProvider id="task-details-page" initialTabIdx={initialTabIdx}>
      <TaskDetailsPageContent />
    </TabsContextProvider>
  );
}
