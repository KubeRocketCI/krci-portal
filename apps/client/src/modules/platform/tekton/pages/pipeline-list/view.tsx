import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PipelineList } from "./components/PipelineList";
import { Bot } from "lucide-react";

export default function PipelineListPage() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Pipelines" }]}>
      <PageContentWrapper
        icon={Bot}
        title="Pipelines"
        description="Browse and visualize your Tekton pipelines. View pipeline definitions and their task dependencies."
      >
        <div className="flex flex-grow flex-col gap-6">
          <PipelineList />
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
