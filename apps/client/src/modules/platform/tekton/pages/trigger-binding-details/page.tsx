import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { tabNameToIndexMap } from "./constants";
import { routeTriggerBindingDetails } from "./route";
import TriggerBindingDetailsView from "./view";

export default function TriggerBindingDetailsPage() {
  const search = routeTriggerBindingDetails.useSearch();
  const initialTabIdx = search.tab ? tabNameToIndexMap[search.tab] : 0;
  return (
    <TabsContextProvider id="trigger-binding-details-page" initialTabIdx={initialTabIdx}>
      <TriggerBindingDetailsView searchTabIdx={initialTabIdx} />
    </TabsContextProvider>
  );
}
