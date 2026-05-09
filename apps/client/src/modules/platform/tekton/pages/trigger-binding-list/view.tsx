import { Link2 } from "lucide-react";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { TriggerBindingList } from "./components/TriggerBindingList";

export default function TriggerBindingListView() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Webhook Triggers" }, { label: "Trigger Bindings" }]}>
      <PageContentWrapper
        icon={Link2}
        title="Trigger Bindings"
        description="Mappings from webhook payload fields to TriggerTemplate parameter values."
      >
        <div className="flex flex-grow flex-col gap-6">
          <TriggerBindingList />
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
