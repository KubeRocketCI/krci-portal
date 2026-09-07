import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useProjects } from "../../hooks/useProjects";
import { ProjectsFilter } from "../ProjectsFilter";
import { EmptyList } from "@/core/components/EmptyList";

interface ProjectsTableProps {
  page: number;
  pageSize: number;
  searchTerm: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (searchTerm: string) => void;
}

/** SAST projects list on `DataTable` in server mode: paging and search run on the server; sort applies to the visible page. */
export function ProjectsTable({
  page,
  pageSize,
  searchTerm,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
}: ProjectsTableProps) {
  const columns = useColumns();

  // Convert 0-indexed page to 1-indexed for SonarQube API
  const { data, isLoading, isError, error } = useProjects({
    page: page + 1,
    pageSize,
    searchTerm: searchTerm || undefined,
  });

  return (
    <DataTable
      id={TABLE.SAST_PROJECTS_LIST.id}
      mode="server"
      data={data?.projects || []}
      columns={columns}
      isLoading={isLoading}
      blockerError={isError ? (error as Error) : undefined}
      emptyListComponent={<EmptyList customText="No SonarQube projects found" />}
      slots={{
        header: { component: <ProjectsFilter searchTerm={searchTerm} onSearchChange={onSearchChange} /> },
      }}
      pagination={{
        show: true,
        page,
        rowsPerPage: pageSize,
        totalCount: data?.paging?.total,
        onPageChange,
        onRowsPerPageChange: onPageSizeChange,
      }}
      settings={{
        show: true,
      }}
    />
  );
}
