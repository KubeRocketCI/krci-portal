import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { TaskList } from "./components/TaskList";
import { Bot } from "lucide-react";

export default function PipelineListPage() {
  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Tasks",
        },
      ]}
    >
      <Section
        icon={Bot}
        title="Tasks"
        description="Browse and visualize your Tekton tasks. View task definitions and their task dependencies."
      >
        <div className="flex flex-grow flex-col gap-6">
          <TaskList />
        </div>
      </Section>
    </PageWrapper>
  );
}
