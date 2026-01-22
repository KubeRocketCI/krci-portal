import { useCallback } from "react";
import { ServerSideTable } from "@/core/components/ServerSideTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { useServices } from "../../hooks/useServices";
import { useServicesColumns } from "../../hooks/useServicesColumns";
import { routeSCAProjectDetails } from "../../route";
import { router } from "@/core/router";
import { PATH_SCA_PROJECT_DETAILS_FULL } from "../../route";

interface ProjectServicesProps {
  projectUuid: string;
}

export function ProjectServices({ projectUuid }: ProjectServicesProps) {
  const params = routeSCAProjectDetails.useParams();
  const search = routeSCAProjectDetails.useSearch();

  // Convert from 1-indexed URL page to 0-indexed table page
  const urlPage = search.page;
  const page = urlPage !== undefined ? urlPage - 1 : 0;

  // Get default rowsPerPage from localStorage settings or use 25
  const defaultRowsPerPage = JSON.parse(localStorage.getItem("settings") || "{}")?.tableDefaultRowsPerPage || 25;
  const pageSize = search.rowsPerPage ?? defaultRowsPerPage;

  const columns = useServicesColumns();

  const { data, isLoading, error } = useServices({
    uuid: projectUuid,
    pageNumber: page,
    pageSize,
  });

  const services = data?.services || [];
  const totalCount = data?.totalCount || 0;

  const handlePageChange = useCallback(
    (newPage: number) => {
      // Convert from 0-indexed table page to 1-indexed URL page
      const urlPage = newPage + 1;
      router.navigate({
        to: PATH_SCA_PROJECT_DETAILS_FULL,
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
        to: PATH_SCA_PROJECT_DETAILS_FULL,
        params,
        search: (prev) => ({ ...prev, rowsPerPage: newPageSize, page: 1 }),
      });
    },
    [params]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Services ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Error loading services:</strong> {String(error)}
            </div>
          )}
          {!isLoading && !error && services.length === 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No services found for this project.
            </div>
          )}
          <ServerSideTable
            id="project-services-table"
            data={services}
            columns={columns}
            isLoading={isLoading}
            blockerError={error instanceof Error ? error : error ? new Error(String(error)) : undefined}
            pagination={{
              show: true,
              page,
              rowsPerPage: pageSize,
              totalCount,
              onPageChange: handlePageChange,
              onRowsPerPageChange: handlePageSizeChange,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
