import { useState } from "react";
import { ServerSideTable } from "@/core/components/ServerSideTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Label } from "@/core/components/ui/label";
import { Switch } from "@/core/components/ui/switch";
import { useComponents } from "../../hooks/useComponents";
import { useComponentsColumns } from "../../hooks/useComponentsColumns";

interface ProjectComponentsProps {
  projectUuid: string;
}

export function ProjectComponents({ projectUuid }: ProjectComponentsProps) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [onlyOutdated, setOnlyOutdated] = useState(false);
  const [onlyDirect, setOnlyDirect] = useState(false);

  const columns = useComponentsColumns();

  const { data, isLoading, error } = useComponents({
    uuid: projectUuid,
    pageNumber: page,
    pageSize,
    onlyOutdated,
    onlyDirect,
  });

  const components = data?.components || [];
  const totalCount = data?.totalCount || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Components ({totalCount})</CardTitle>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="only-outdated"
                  checked={onlyOutdated}
                  onCheckedChange={(checked) => {
                    setOnlyOutdated(checked);
                    setPage(0);
                  }}
                />
                <Label htmlFor="only-outdated" className="cursor-pointer text-sm">
                  Outdated Only
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="only-direct"
                  checked={onlyDirect}
                  onCheckedChange={(checked) => {
                    setOnlyDirect(checked);
                    setPage(0);
                  }}
                />
                <Label htmlFor="only-direct" className="cursor-pointer text-sm">
                  Direct Dependencies Only
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Error loading components:</strong> {String(error)}
            </div>
          )}
          {!isLoading && !error && components.length === 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No components found for this project.
            </div>
          )}
          <ServerSideTable
            id="project-components-table"
            data={components}
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
