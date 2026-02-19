import { Badge } from "@/core/components/ui/badge";
import { KeyRound } from "lucide-react";
import { ExposedSecretReport, exposedSecretReportLabels } from "@my-project/shared";
import { TrivyReportDetailHeader } from "@/modules/platform/security/components/shared/TrivyReportDetailHeader";
import { getAuditSummaryStats } from "@/modules/platform/security/components/shared/TrivyReportDetailHeader/utils";

interface SecretHeaderProps {
  report: ExposedSecretReport | undefined;
  isLoading: boolean;
}

export function SecretHeader({ report, isLoading }: SecretHeaderProps) {
  const summary = report?.report.summary;
  const artifact = report?.report?.artifact;
  const registry = report?.report?.registry;
  const scanner = report?.report?.scanner;
  const namespace = report?.metadata?.namespace || "";
  const resourceName = report?.metadata?.labels?.[exposedSecretReportLabels.resourceName] || "";
  const resourceKind = report?.metadata?.labels?.[exposedSecretReportLabels.resourceKind] || "";
  const totalSecrets = report?.report?.secrets?.length || 0;
  const imageName = artifact
    ? `${registry?.server ? registry.server + "/" : ""}${artifact.repository}:${artifact.tag || "latest"}`
    : "";
  const totalIssues = summary ? summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount : 0;

  return (
    <TrivyReportDetailHeader
      isLoading={isLoading}
      isEmpty={!report}
      icon={KeyRound}
      title={imageName}
      titleExtra={totalIssues === 0 && summary ? <Badge variant="success">No Secrets Found</Badge> : undefined}
      metadata={
        <>
          {namespace && (
            <span>
              Namespace: <span className="text-foreground">{namespace}</span>
            </span>
          )}
          {resourceName && (
            <span>
              Resource: <span className="text-foreground">{resourceName}</span>
              {resourceKind && ` (${resourceKind})`}
            </span>
          )}
          <span>
            Total Secrets: <span className="text-foreground">{totalSecrets}</span>
          </span>
        </>
      }
      badges={
        <>
          {scanner?.name && (
            <Badge variant="secondary" className="text-xs">
              {scanner.name} {scanner.version && `v${scanner.version}`}
            </Badge>
          )}
          {report?.report?.updateTimestamp && (
            <Badge variant="secondary" className="text-xs">
              Last scan: {new Date(report.report.updateTimestamp).toLocaleString()}
            </Badge>
          )}
        </>
      }
      summaryStats={summary ? getAuditSummaryStats(summary) : []}
    />
  );
}
