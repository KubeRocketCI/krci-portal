import { ServerSideTable } from "@/core/components/ServerSideTable";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useProjects } from "../../hooks/useProjects";
import { ProjectsFilter } from "../ProjectsFilter";
import { EmptyList } from "@/core/components/EmptyList";

interface ProjectsListProps {
  page: number;
  pageSize: number;
  searchTerm: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (searchTerm: string) => void;
}

/**
 * SCA Projects list component using ServerSideTable
 * Features:
 * - Server-side pagination (fetches only current page)
 * - Server-side search (searches across all pages)
 * - Client-side sorting (on current page data)
 * - Column visibility settings (persisted to localStorage)
 */
export function ProjectsList({
  page,
  pageSize,
  searchTerm,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
}: ProjectsListProps) {
  const columns = useColumns();

  const { data, isLoading, isError, error } = useProjects({
    pageNumber: page, // Backend handles conversion to 1-indexed for DT API
    pageSize,
    searchTerm,
    onlyRoot: true, // Only show root projects (no children)
  });

  return (
    <ServerSideTable
      id={TABLE.SCA_PROJECTS_LIST.id}
      data={data?.projects || []}
      columns={columns}
      isLoading={isLoading}
      blockerError={isError ? (error as Error) : undefined}
      emptyListComponent={<EmptyList customText="No projects found" />}
      slots={{
        header: <ProjectsFilter searchTerm={searchTerm} onSearchChange={onSearchChange} />,
      }}
      pagination={{
        show: true,
        page,
        rowsPerPage: pageSize,
        totalCount: data?.totalCount || 0,
        onPageChange,
        onRowsPerPageChange: onPageSizeChange,
      }}
      settings={{
        show: true, // Enable column visibility settings
      }}
    />
  );
}
