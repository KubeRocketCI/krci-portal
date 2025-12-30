import { useMemo } from "react";
import { DependencyTrackComponent } from "@my-project/shared";
import { Check, AlertTriangle, Info, CheckSquare } from "lucide-react";
import { TableColumn } from "@/core/components/Table/types";
import { VulnerabilityProgressBar } from "../../sca/components/shared/VulnerabilityProgressBar";

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

export function useComponentsColumns(): TableColumn<DependencyTrackComponent>[] {
  return useMemo(
    () => [
      {
        id: "name",
        label: "Component",
        data: {
          columnSortableValuePath: "name",
          render: ({ data }) => <div className="text-sm font-medium">{data.name}</div>,
        },
        cell: {
          baseWidth: 25,
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
          render: ({ data }) => {
            const component = data;
            const latestVersion = component.repositoryMeta?.latestVersion;

            if (!latestVersion) {
              return <span className="text-sm">{component.version}</span>;
            }

            const comparison = compareVersions(latestVersion, component.version);

            if (comparison > 0) {
              // Outdated - icon floated to the right like original DT
              return (
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm">{component.version}</span>
                  <span title={`Risk: Outdated component. Current version is: ${latestVersion}`}>
                    <AlertTriangle className="ml-auto h-4 w-4 flex-shrink-0 text-amber-500" />
                  </span>
                </div>
              );
            } else if (comparison < 0) {
              // Unstable
              return (
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm">{component.version}</span>
                  <span title={`Risk: Unstable component. Current stable version is: ${latestVersion}`}>
                    <Info className="ml-auto h-4 w-4 flex-shrink-0 text-blue-500" />
                  </span>
                </div>
              );
            } else {
              // Latest
              return (
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm">{component.version}</span>
                  <span title="Component version is the latest available from the configured repositories">
                    <Check className="ml-auto h-4 w-4 flex-shrink-0 text-green-500" />
                  </span>
                </div>
              );
            }
          },
        },
        cell: {
          baseWidth: 25,
          props: {
            align: "left",
          },
        },
      },
      {
        id: "group",
        label: "Group",
        data: {
          columnSortableValuePath: "group",
          render: ({ data }) => <span className="text-sm">{data.group || ""}</span>,
        },
        cell: {
          baseWidth: 8,
          props: {
            align: "left",
          },
        },
      },
      {
        id: "internal",
        label: "Internal",
        data: {
          render: ({ data }) => {
            return data.isInternal ? <CheckSquare className="text-muted-foreground h-4 w-4" /> : null;
          },
        },
        cell: {
          baseWidth: 8,
          props: {
            align: "center",
          },
        },
      },
      {
        id: "license",
        label: "License",
        data: {
          render: ({ data }) => {
            const component = data;
            const license = component.resolvedLicense?.licenseId || component.license || component.licenseExpression;
            return <span className="text-sm">{license || ""}</span>;
          },
        },
        cell: {
          baseWidth: 8,
          props: {
            align: "left",
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
          baseWidth: 8,
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
          baseWidth: 18,
          props: {
            align: "left",
          },
        },
      },
    ],
    []
  );
}
