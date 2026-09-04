import { useMemo } from "react";
import { TableColumn } from "@/core/components/Table/types";
import { ProjectWithMetrics } from "@my-project/shared";
import { QualityGateBadge } from "../components/QualityGateBadge";
import { Badge } from "@/core/components/ui/badge";
import { Bug, ShieldAlert, AlertTriangle, BarChart3, Copy } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_SAST_PROJECT_DETAILS_FULL } from "../../sast-project-details/route";
import { getRatingLabel, getRatingColorClass } from "../utils";

/**
 * Hook to define columns for the SAST Projects table
 */
export const useColumns = (): TableColumn<ProjectWithMetrics>[] => {
  const { namespace, clusterName } = useParams({ strict: false });

  return useMemo(
    () => [
      {
        id: "name",
        label: "Project Name",
        data: {
          columnSortableValuePath: "name",
          render: ({ data }) => (
            <Link
              to={PATH_SAST_PROJECT_DETAILS_FULL}
              params={{
                namespace: namespace || "",
                clusterName: clusterName || "",
                projectKey: data.key,
              }}
              className="text-foreground hover:text-primary hover:underline"
            >
              {data.name}
            </Link>
          ),
        },
        cell: {
          isFixed: true,
          baseWidth: 25,
        },
      },
      {
        id: "qualityGate",
        label: "Quality Gate",
        data: {
          columnSortableValuePath: "qualityGateStatus",
          render: ({ data }) => <QualityGateBadge status={data.qualityGateStatus} />,
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "visibility",
        label: "Visibility",
        data: {
          columnSortableValuePath: "visibility",
          render: ({ data }) => {
            if (!data.visibility) return <span className="text-muted-foreground text-sm">-</span>;
            return (
              <Badge variant={data.visibility === "public" ? "success" : "info"}>{data.visibility.toUpperCase()}</Badge>
            );
          },
        },
        cell: {
          baseWidth: 10,
        },
      },
      {
        id: "bugs",
        label: "Bugs",
        data: {
          columnSortableValuePath: "measures.bugs",
          render: ({ data }) => {
            const bugs = data.measures?.bugs;
            const rating = data.measures?.reliability_rating;
            const ratingLabel = getRatingLabel(rating);
            return (
              <div className="flex items-center gap-2">
                <Bug className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">{bugs || "0"}</span>
                <Badge variant="outline" className={`text-xs ${getRatingColorClass(ratingLabel)}`}>
                  {ratingLabel || "-"}
                </Badge>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "vulnerabilities",
        label: "Vulnerabilities",
        data: {
          columnSortableValuePath: "measures.vulnerabilities",
          render: ({ data }) => {
            const vulns = data.measures?.vulnerabilities;
            const rating = data.measures?.security_rating;
            const ratingLabel = getRatingLabel(rating);
            return (
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">{vulns || "0"}</span>
                <Badge variant="outline" className={`text-xs ${getRatingColorClass(ratingLabel)}`}>
                  {ratingLabel || "-"}
                </Badge>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 14,
        },
      },
      {
        id: "codeSmells",
        label: "Code Smells",
        data: {
          columnSortableValuePath: "measures.code_smells",
          render: ({ data }) => {
            const smells = data.measures?.code_smells;
            const rating = data.measures?.sqale_rating;
            const ratingLabel = getRatingLabel(rating);
            return (
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">{smells || "0"}</span>
                <Badge variant="outline" className={`text-xs ${getRatingColorClass(ratingLabel)}`}>
                  {ratingLabel || "-"}
                </Badge>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 14,
        },
      },
      {
        id: "coverage",
        label: "Coverage",
        data: {
          columnSortableValuePath: "measures.coverage",
          render: ({ data }) => {
            const coverage = data.measures?.coverage;
            return (
              <div className="flex items-center gap-2">
                <BarChart3 className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">{coverage ? `${coverage}%` : "-"}</span>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 10,
        },
      },
      {
        id: "duplications",
        label: "Duplications",
        data: {
          columnSortableValuePath: "measures.duplicated_lines_density",
          render: ({ data }) => {
            const duplications = data.measures?.duplicated_lines_density;
            return (
              <div className="flex items-center gap-2">
                <Copy className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">{duplications ? `${duplications}%` : "-"}</span>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "lastAnalysis",
        label: "Last Analysis",
        data: {
          columnSortableValuePath: "lastAnalysisDate",
          render: ({ data }) => {
            if (!data.lastAnalysisDate) return <div className="text-muted-foreground text-sm">-</div>;
            const date = new Date(data.lastAnalysisDate);
            return (
              <div className="text-sm">
                {date.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </div>
            );
          },
        },
        cell: {
          baseWidth: 18,
        },
      },
    ],
    [namespace, clusterName]
  );
};
