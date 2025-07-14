import { ResourceActionListContextProvider } from "@/core/providers/ResourceActionList/provider";
import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import CodebaseDetailsPageContent from "./view";

export default function CodebaseDetailsPage() {
  return (
    <TabsContextProvider id={""}>
      <ResourceActionListContextProvider>
        <CodebaseDetailsPageContent />
      </ResourceActionListContextProvider>
    </TabsContextProvider>
  );
}
