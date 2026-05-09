import { Funnel } from "lucide-react";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { InterceptorList } from "./components/InterceptorList";

export default function InterceptorListView() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Webhook Triggers" }, { label: "Interceptors" }]}>
      <PageContentWrapper
        icon={Funnel}
        title="Interceptors"
        description="Namespace-scoped CEL/HTTP filters that decide whether a webhook event proceeds to its trigger."
      >
        <div className="flex flex-grow flex-col gap-6">
          <InterceptorList />
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
