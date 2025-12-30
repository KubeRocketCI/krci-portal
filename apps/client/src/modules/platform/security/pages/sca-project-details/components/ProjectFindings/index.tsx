import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { useFindingsByProject } from "../../hooks/useFindingsByProject";
import { FindingRow } from "./components/FindingRow";

interface ProjectFindingsProps {
  projectUuid: string;
}

export function ProjectFindings({ projectUuid }: ProjectFindingsProps) {
  const [showSuppressed, setShowSuppressed] = useState(false);

  const { data, isLoading, error } = useFindingsByProject({
    uuid: projectUuid,
    suppressed: showSuppressed,
  });

  const findings = useMemo(() => data || [], [data]);

  // Filter out suppressed findings if toggle is off
  const displayedFindings = useMemo(() => {
    if (showSuppressed) {
      return findings;
    }
    return findings.filter((f) => !f.analysis.isSuppressed);
  }, [findings, showSuppressed]);

  const { suppressedCount, activeCount } = useMemo(() => {
    const suppressed = findings.filter((f) => f.analysis.isSuppressed).length;
    return { suppressedCount: suppressed, activeCount: findings.length - suppressed };
  }, [findings]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground p-8 text-center text-lg">Loading findings...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Error loading findings:</strong> {String(error)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Vulnerabilities</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {activeCount} active finding{activeCount !== 1 ? "s" : ""}
              {suppressedCount > 0 && `, ${suppressedCount} suppressed`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="show-suppressed" checked={showSuppressed} onCheckedChange={setShowSuppressed} />
            <Label htmlFor="show-suppressed" className="cursor-pointer">
              Show suppressed
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayedFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">No vulnerabilities found</p>
            <p className="text-muted-foreground text-sm">
              {showSuppressed
                ? "This project has no security findings."
                : "This project has no active security findings. Toggle 'Show suppressed' to view suppressed findings."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Column Headers */}
            <div className="bg-muted/50 text-muted-foreground grid grid-cols-12 gap-4 rounded-lg px-4 py-2 text-xs font-semibold">
              <div className="col-span-3">COMPONENT</div>
              <div className="col-span-3">VULNERABILITY</div>
              <div className="col-span-2">SEVERITY</div>
              <div className="col-span-2">ANALYSIS</div>
              <div className="col-span-1">STATUS</div>
              <div className="col-span-1">ANALYZER</div>
            </div>

            {/* Findings List */}
            <div className="max-h-[600px] space-y-2 overflow-auto">
              {displayedFindings.map((finding, index) => (
                <FindingRow key={`${finding.matrix}-${index}`} finding={finding} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
