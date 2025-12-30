import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Shield } from "lucide-react";
import { useState } from "react";
import { ProjectsList } from "./components/ProjectsList";

export default function SCAProjectsPageContent() {
  const [page, setPage] = useState(0); // 0-indexed for table component
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "SCA" }, { label: "Projects" }]}>
      <Section
        icon={Shield}
        title="SCA Projects"
        description="Software composition analysis projects and their security metrics"
      >
        <ProjectsList
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
