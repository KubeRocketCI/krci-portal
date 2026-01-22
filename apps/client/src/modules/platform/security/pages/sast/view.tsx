import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Shield } from "lucide-react";
import { useState, useCallback } from "react";
import { ProjectsTable } from "./components/ProjectsTable";
import { routeSAST } from "./route";
import { router } from "@/core/router";
import { PATH_SAST_FULL } from "./route";

export default function SASTPageContent() {
  const params = routeSAST.useParams();
  const search = routeSAST.useSearch();

  // Convert from 1-indexed URL page to 0-indexed table page
  const urlPage = search.page;
  const page = urlPage !== undefined ? urlPage - 1 : 0;

  // Get default rowsPerPage from localStorage settings or use 25
  const defaultRowsPerPage = JSON.parse(localStorage.getItem("settings") || "{}")?.tableDefaultRowsPerPage || 25;
  const pageSize = search.rowsPerPage ?? defaultRowsPerPage;

  const [searchTerm, setSearchTerm] = useState("");

  const handlePageChange = useCallback(
    (newPage: number) => {
      // Convert from 0-indexed table page to 1-indexed URL page
      const urlPage = newPage + 1;
      router.navigate({
        to: PATH_SAST_FULL,
        params,
        search: (prev) => ({ ...prev, page: urlPage }),
      });
    },
    [params]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      // Update localStorage only on user interaction
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      settings.tableDefaultRowsPerPage = newPageSize;
      localStorage.setItem("settings", JSON.stringify(settings));

      // Update URL - reset to page 1 (1-indexed)
      router.navigate({
        to: PATH_SAST_FULL,
        params,
        search: (prev) => ({ ...prev, rowsPerPage: newPageSize, page: 1 }),
      });
    },
    [params]
  );

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
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSearchChange={setSearchTerm}
        />
      </Section>
    </PageWrapper>
  );
}
