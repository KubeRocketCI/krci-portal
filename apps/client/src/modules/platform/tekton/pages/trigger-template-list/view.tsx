import { FileCode } from "lucide-react";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { TriggerTemplateList } from "./components/TriggerTemplateList";

export default function TriggerTemplateListView() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Webhook Triggers" }, { label: "Trigger Templates" }]}>
      <PageContentWrapper
        icon={FileCode}
        title="Trigger Templates"
        description="PipelineRun blueprints. Templates produce a Tekton PipelineRun whenever an EventListener fires; bindings supply the parameter values."
      >
        <div className="flex flex-grow flex-col gap-6">
          <TriggerTemplateList />
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
