import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { tabNameToIndexMap } from "./constants";
import { routeTriggerDetails } from "./route";
import TriggerDetailsView from "./view";

export default function TriggerDetailsPage() {
  const search = routeTriggerDetails.useSearch();
  const initialTabIdx = search.tab ? tabNameToIndexMap[search.tab] : 0;
  return (
    <TabsContextProvider id="trigger-details-page" initialTabIdx={initialTabIdx}>
      <TriggerDetailsView searchTabIdx={initialTabIdx} />
    </TabsContextProvider>
  );
}
