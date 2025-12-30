import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";
import { Finding } from "@my-project/shared";
import { SeverityBadge } from "./SeverityBadge";
import { AnalysisStateBadge } from "./AnalysisStateBadge";
import { FindingDetail } from "./FindingDetail";

interface FindingRowProps {
  finding: Finding;
}

/**
 * Expandable row component for displaying a finding
 */
export function FindingRow({ finding }: FindingRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="overflow-hidden rounded-lg border">
        <CollapsibleTrigger asChild>
          <div className="hover:bg-muted/50 cursor-pointer p-4 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex items-center pt-0.5">
                {isOpen ? (
                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                ) : (
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                )}
              </div>

              <div className="grid flex-1 grid-cols-12 gap-4">
                {/* Component */}
                <div className="col-span-3 space-y-1">
                  <div className="text-sm font-medium">{finding.component.name}</div>
                  {finding.component.version && (
                    <div className="text-muted-foreground text-xs">{finding.component.version}</div>
                  )}
                </div>

                {/* Vulnerability */}
                <div className="col-span-3 space-y-1">
                  <div className="font-mono text-xs">
                    <span className="text-muted-foreground">{finding.vulnerability.source}:</span>{" "}
                    {finding.vulnerability.vulnId}
                  </div>
                  {finding.vulnerability.cwes && finding.vulnerability.cwes.length > 0 && (
                    <div className="text-muted-foreground text-xs">
                      {finding.vulnerability.cwes
                        .slice(0, 2)
                        .map((cwe) => `CWE-${cwe.cweId}`)
                        .join(", ")}
                      {finding.vulnerability.cwes.length > 2 && ` +${finding.vulnerability.cwes.length - 2}`}
                    </div>
                  )}
                </div>

                {/* Severity */}
                <div className="col-span-2">
                  <SeverityBadge severity={finding.vulnerability.severity} />
                </div>

                {/* Analysis State */}
                <div className="col-span-2">
                  <AnalysisStateBadge state={finding.analysis.state} />
                </div>

                {/* Suppressed */}
                <div className="col-span-1 flex items-center">
                  {finding.analysis.isSuppressed && (
                    <Badge variant="outline" className="text-xs">
                      Suppressed
                    </Badge>
                  )}
                </div>

                {/* Analyzer */}
                <div className="text-muted-foreground col-span-1 truncate text-xs">
                  {finding.attribution.analyzerIdentity || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <FindingDetail finding={finding} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
