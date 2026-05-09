import { Webhook } from "lucide-react";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { EventListenerList } from "./components/EventListenerList";

export default function EventListenerListView() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Webhook Triggers" }, { label: "Event Listeners" }]}>
      <PageContentWrapper
        icon={Webhook}
        title="Event Listeners"
        description="Webhook entrypoints. Each EventListener exposes an HTTP endpoint that fans incoming events out to its configured triggers."
      >
        <div className="flex flex-grow flex-col gap-6">
          <EventListenerList />
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
