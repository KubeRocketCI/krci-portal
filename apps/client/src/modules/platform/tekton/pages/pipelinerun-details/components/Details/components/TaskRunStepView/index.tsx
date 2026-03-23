import { TaskRunStep } from "../TaskRunStep";
import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { Card } from "@/core/components/ui/card";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";

export function TaskRunStepView({ tabs, tabsContextId }: { tabs: Tab[]; tabsContextId: string }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-1 flex-col p-4">
        <TabsContextProvider id={tabsContextId}>
          <TaskRunStep tabs={tabs} />
        </TabsContextProvider>
      </div>
    </Card>
  );
}
