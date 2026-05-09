import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { tabNameToIndexMap } from "./constants";
import { routeTriggerTemplateDetails } from "./route";
import TriggerTemplateDetailsView from "./view";

export default function TriggerTemplateDetailsPage() {
  const search = routeTriggerTemplateDetails.useSearch();
  const initialTabIdx = search.tab ? tabNameToIndexMap[search.tab] : 0;
  return (
    <TabsContextProvider id="trigger-template-details-page" initialTabIdx={initialTabIdx}>
      <TriggerTemplateDetailsView searchTabIdx={initialTabIdx} />
    </TabsContextProvider>
  );
}
