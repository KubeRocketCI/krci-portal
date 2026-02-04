import { useMemo, useState } from "react";
import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "../../hooks/useColumns";
import { useExposedSecretReportWatchList } from "@/k8s/api/groups/Trivy/ExposedSecretReport";
import { EmptyList } from "@/core/components/EmptyList";
import { consolidateSecretImages } from "../../utils/consolidateSecretImages";
import { ResourcesExpandedRow } from "../../../trivy-vulnerabilities/components/ResourcesExpandedRow";
import { ConsolidatedSecretImage } from "../../types";

interface ExposedSecretListProps {
  namespace?: string;
}

/**
 * ExposedSecretList component displays a table of consolidated Trivy exposed secret images.
 * Groups reports by unique image (digest + namespace) and shows where each image is used
 * in an expandable row.
 */
export function ExposedSecretList({ namespace }: ExposedSecretListProps) {
  const columns = useColumns();
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(new Set());

  const exposedSecretReportWatchList = useExposedSecretReportWatchList({ namespace });

  const consolidatedImages = useMemo(
    () => consolidateSecretImages(exposedSecretReportWatchList.data.array),
    [exposedSecretReportWatchList.data.array]
  );

  return (
    <DataTable<ConsolidatedSecretImage>
      id={TABLE.TRIVY_EXPOSED_SECRET_REPORTS_LIST.id}
      data={consolidatedImages}
      columns={columns}
      isLoading={exposedSecretReportWatchList.isLoading}
      blockerError={exposedSecretReportWatchList.error ? (exposedSecretReportWatchList.error as Error) : undefined}
      emptyListComponent={
        <EmptyList
          customText="No exposed secret reports found"
          description="Trivy exposed secret reports will appear here once container images are scanned"
        />
      }
      expandable={{
        getRowId: (row) => row.imageKey,
        expandedRowIds,
        onExpandedRowsChange: setExpandedRowIds,
        expandedRowRender: (row) => <ResourcesExpandedRow resources={row.resources} />,
      }}
      pagination={{
        show: true,
      }}
      settings={{
        show: true,
      }}
    />
  );
}
