import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { PipelineList } from "./components/PipelineList";

export default function PipelineListPage() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Pipelines" }]}>
      <Section description="Browse and visualize your Tekton pipelines. View pipeline definitions and their task dependencies.">
        <div className="flex flex-col gap-6 flex-grow">
          <PipelineList />
        </div>
      </Section>
    </PageWrapper>
  );
}
