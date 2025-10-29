import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { TaskList } from "./components/TaskList";

export default function PipelineListPage() {
  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Tasks",
        },
      ]}
    >
      <Section description="Browse and visualize your Tekton tasks. View task definitions and their task dependencies.">
        <div className="flex flex-col gap-6 flex-grow">
          <TaskList />
        </div>
      </Section>
    </PageWrapper>
  );
}
