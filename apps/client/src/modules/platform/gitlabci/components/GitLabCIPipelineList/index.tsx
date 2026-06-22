import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { GITLABCI_TABLE_ID } from "../../constants";
import type { GitLabCIPipelineRow } from "../../hooks/useGitLabCIPipelines";
import { useColumns } from "./hooks/useColumns";

export interface GitLabCIPipelineListProps {
  pipelines: GitLabCIPipelineRow[];
  isLoading: boolean;
  showCodebaseColumn?: boolean;
  tableId?: string;
  tableName?: string;
  emptyItemName?: string;
  blockerError?: Error | null;
  errors?: Error[] | null;
}

export function GitLabCIPipelineList({
  pipelines,
  isLoading,
  showCodebaseColumn = true,
  tableId = GITLABCI_TABLE_ID,
  tableName = "GitLab CI Pipelines",
  emptyItemName = "GitLab CI pipelines",
  blockerError,
  errors,
}: GitLabCIPipelineListProps) {
  const columns = useColumns({ showCodebaseColumn });

  return (
    <DataTable
      id={tableId}
      name={tableName}
      columns={columns}
      data={pipelines}
      isLoading={isLoading}
      blockerError={blockerError}
      errors={errors}
      emptyListComponent={<EmptyList missingItemName={emptyItemName} />}
      pagination={{ show: true, rowsPerPage: 10 }}
      outlined={false}
    />
  );
}
