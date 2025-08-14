import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Stack } from "@mui/material";
import { PipelineList } from "./components/PipelineList";

export default function PipelineListPage() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Pipelines" }]}>
      <Section description="Browse and visualize your Tekton pipelines. View pipeline definitions and their task dependencies.">
        <Stack spacing={3} flexGrow={1} display="flex">
          <PipelineList />
        </Stack>
      </Section>
    </PageWrapper>
  );
}
