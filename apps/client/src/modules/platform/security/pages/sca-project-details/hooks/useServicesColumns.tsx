import { useMemo } from "react";
import { DependencyTrackService } from "@my-project/shared";
import { CheckSquare } from "lucide-react";
import { TableColumn } from "@/core/components/Table/types";
import { VulnerabilityProgressBar } from "../../sca/components/shared/VulnerabilityProgressBar";

export function useServicesColumns(): TableColumn<DependencyTrackService>[] {
  return useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          columnSortableValuePath: "name",
          render: ({ data }) => <div className="text-sm font-medium">{data.name}</div>,
        },
        cell: {
          baseWidth: 30,
          props: {
            align: "left",
          },
        },
      },
      {
        id: "version",
        label: "Version",
        data: {
          columnSortableValuePath: "version",
          render: ({ data }) => <span className="text-sm">{data.version || "-"}</span>,
        },
        cell: {
          baseWidth: 15,
          props: {
            align: "left",
          },
        },
      },
      {
        id: "authenticated",
        label: "Authenticated",
        data: {
          render: ({ data }) => {
            return data.authenticated ? <CheckSquare className="text-muted-foreground h-4 w-4" /> : null;
          },
        },
        cell: {
          baseWidth: 12,
          props: {
            align: "center",
          },
        },
      },
      {
        id: "crossesTrustBoundary",
        label: "X Trust Boundary",
        data: {
          render: ({ data }) => {
            return data.crossesTrustBoundary ? <CheckSquare className="text-muted-foreground h-4 w-4" /> : null;
          },
        },
        cell: {
          baseWidth: 13,
          props: {
            align: "center",
          },
        },
      },
      {
        id: "riskScore",
        label: "Risk Score",
        data: {
          columnSortableValuePath: "lastInheritedRiskScore",
          render: ({ data }) => {
            const score = data.lastInheritedRiskScore;
            return <span className="text-sm">{score?.toFixed(0) || "0"}</span>;
          },
        },
        cell: {
          baseWidth: 10,
          props: {
            align: "right",
          },
        },
      },
      {
        id: "vulnerabilities",
        label: "Vulnerabilities",
        data: {
          render: ({ data }) => {
            if (!data.metrics) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }
            return <VulnerabilityProgressBar metrics={data.metrics} />;
          },
        },
        cell: {
          baseWidth: 20,
          props: {
            align: "left",
          },
        },
      },
    ],
    []
  );
}
