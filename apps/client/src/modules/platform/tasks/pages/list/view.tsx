import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Stack } from "@mui/material";
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
        <Stack spacing={3} flexGrow={1} display="flex">
          <TaskList />
        </Stack>
      </Section>
    </PageWrapper>
  );
}
