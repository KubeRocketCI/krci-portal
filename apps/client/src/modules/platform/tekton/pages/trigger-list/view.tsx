import { Zap } from "lucide-react";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { TriggerList } from "./components/TriggerList";

export default function TriggerListView() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Webhook Triggers" }, { label: "Triggers" }]}>
      <PageContentWrapper
        icon={Zap}
        title="Triggers"
        description="A reusable bundle of interceptors, bindings, and a template that can be referenced by one or more EventListeners."
      >
        <div className="flex flex-grow flex-col gap-6">
          <TriggerList />
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
