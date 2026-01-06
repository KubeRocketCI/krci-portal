import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Shield } from "lucide-react";
import { useState } from "react";
import { ProjectsTable } from "./components/ProjectsTable";

export default function SASTPageContent() {
  const [page, setPage] = useState(0); // 0-indexed for table component
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "SAST" }, { label: "Projects" }]}>
      <Section
        icon={Shield}
        title="Static Application Security Testing"
        description="SonarQube projects and their code quality metrics"
      >
        <ProjectsTable
          page={page}
          pageSize={pageSize}
          searchTerm={searchTerm}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSearchChange={setSearchTerm}
        />
      </Section>
    </PageWrapper>
  );
}
