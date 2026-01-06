import { ExternalLink } from "lucide-react";
import { Finding } from "@my-project/shared";
import { AnalysisStateBadge } from "./AnalysisStateBadge";

interface FindingDetailProps {
  finding: Finding;
}

/**
 * Expanded detail view for a finding row
 */
export function FindingDetail({ finding }: FindingDetailProps) {
  return (
    <div className="bg-muted/30 space-y-3 border-t pr-4 pb-4 pl-12">
      <div className="grid grid-cols-2 gap-4 pt-4">
        {/* Component Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Component Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20">Name:</span>
              <span className="font-medium">{finding.component.name}</span>
            </div>
            {finding.component.version && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">Version:</span>
                <span>{finding.component.version}</span>
              </div>
            )}
            {finding.component.group && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">Group:</span>
                <span className="font-mono text-xs">{finding.component.group}</span>
              </div>
            )}
            {finding.component.latestVersion && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">Latest:</span>
                <span className="text-xs">{finding.component.latestVersion}</span>
              </div>
            )}
          </div>
        </div>

        {/* Vulnerability Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Vulnerability Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20">ID:</span>
              <span className="font-mono text-xs">
                {finding.vulnerability.source}: {finding.vulnerability.vulnId}
              </span>
            </div>
            {finding.vulnerability.cwes && finding.vulnerability.cwes.length > 0 && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">CWE:</span>
                <span className="text-xs">
                  {finding.vulnerability.cwes
                    .map((cwe: { cweId: number; name: string }) => `CWE-${cwe.cweId}`)
                    .join(", ")}
                </span>
              </div>
            )}
            {finding.vulnerability.aliases && finding.vulnerability.aliases.length > 0 && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">Aliases:</span>
                <div className="space-y-1 text-xs">
                  {finding.vulnerability.aliases.map((alias: { source: string; vulnId: string }, i: number) => (
                    <div key={i}>
                      {alias.source}: {alias.vulnId}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attribution */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Attribution</h4>
          <div className="space-y-1 text-sm">
            {finding.attribution.analyzerIdentity && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">Analyzer:</span>
                <span className="text-xs">{finding.attribution.analyzerIdentity}</span>
              </div>
            )}
            {finding.attribution.attributedOn && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">Date:</span>
                <span className="text-xs">{new Date(finding.attribution.attributedOn).toLocaleString()}</span>
              </div>
            )}
            {finding.attribution.alternateIdentifier && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">Alt ID:</span>
                <span className="font-mono text-xs">{finding.attribution.alternateIdentifier}</span>
              </div>
            )}
            {finding.attribution.referenceUrl && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20">Reference:</span>
                <a
                  href={finding.attribution.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Analysis State */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Analysis</h4>
          <div className="space-y-1 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20">State:</span>
              <AnalysisStateBadge state={finding.analysis.state} />
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20">Suppressed:</span>
              <span>{finding.analysis.isSuppressed ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix ID (hidden identifier) */}
      <div className="text-muted-foreground border-t pt-2 text-xs">
        Matrix: <span className="font-mono">{finding.matrix}</span>
      </div>
    </div>
  );
}
