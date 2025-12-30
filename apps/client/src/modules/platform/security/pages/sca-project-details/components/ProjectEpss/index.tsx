import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { useEpssFindings } from "../../hooks/useEpssFindings";
import { useEpssColumns } from "../../hooks/useEpssColumns";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { EpssVsCvssChart } from "../EpssVsCvssChart";
import { DataTable } from "@/core/components/Table";

interface ProjectEpssProps {
  projectUuid: string;
}

export function ProjectEpss({ projectUuid }: ProjectEpssProps) {
  const [showSuppressed, setShowSuppressed] = useState(false);
  const columns = useEpssColumns();

  const { data, isLoading, error } = useEpssFindings({
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
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Exploit Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground p-8 text-center text-lg">Loading EPSS data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Exploit Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Error loading EPSS data:</strong> {String(error)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* EPSS vs CVSS Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            EPSS vs CVSS Score Distribution
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Scatter plot showing the relationship between CVSS severity scores and EPSS exploit prediction scores
          </p>
        </CardHeader>
        <CardContent>
          <EpssVsCvssChart findings={displayedFindings} height={400} />
        </CardContent>
      </Card>

      {/* Findings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>NVD Findings with EPSS Data</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {activeCount} active finding{activeCount !== 1 ? "s" : ""}
                {suppressedCount > 0 && `, ${suppressedCount} suppressed`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="show-suppressed-epss" checked={showSuppressed} onCheckedChange={setShowSuppressed} />
              <Label htmlFor="show-suppressed-epss" className="cursor-pointer">
                Show suppressed
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedFindings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">No EPSS data found</p>
              <p className="text-muted-foreground text-sm">
                {showSuppressed
                  ? "This project has no NVD findings with EPSS data."
                  : "This project has no active NVD findings with EPSS data. Toggle 'Show suppressed' to view suppressed findings."}
              </p>
            </div>
          ) : (
            <DataTable id="project-epss-table" data={displayedFindings} columns={columns} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
