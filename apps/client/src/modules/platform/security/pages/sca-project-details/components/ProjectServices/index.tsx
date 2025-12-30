import { useState } from "react";
import { ServerSideTable } from "@/core/components/ServerSideTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { useServices } from "../../hooks/useServices";
import { useServicesColumns } from "../../hooks/useServicesColumns";

interface ProjectServicesProps {
  projectUuid: string;
}

export function ProjectServices({ projectUuid }: ProjectServicesProps) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const columns = useServicesColumns();

  const { data, isLoading, error } = useServices({
    uuid: projectUuid,
    pageNumber: page,
    pageSize,
  });

  const services = data?.services || [];
  const totalCount = data?.totalCount || 0;

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
              onPageChange: setPage,
              onRowsPerPageChange: (size) => {
                setPageSize(size);
                setPage(0);
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
