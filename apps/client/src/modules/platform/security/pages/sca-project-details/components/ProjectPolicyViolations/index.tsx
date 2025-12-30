import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { CheckCircle2, Shield } from "lucide-react";
import { useViolationsByProject } from "../../hooks/useViolationsByProject";
import { useViolationsColumns } from "../../hooks/useViolationsColumns";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { DataTable } from "@/core/components/Table";

interface ProjectPolicyViolationsProps {
  projectUuid: string;
}

export function ProjectPolicyViolations({ projectUuid }: ProjectPolicyViolationsProps) {
  const [showSuppressed, setShowSuppressed] = useState(false);
  const columns = useViolationsColumns();

  const { data, isLoading, error } = useViolationsByProject({
    uuid: projectUuid,
    suppressed: showSuppressed,
  });

  const violations = useMemo(() => data || [], [data]);

  // Filter out suppressed violations if toggle is off
  const displayedViolations = useMemo(() => {
    if (showSuppressed) {
      return violations;
    }
    return violations.filter((v) => !v.analysis.isSuppressed);
  }, [violations, showSuppressed]);

  const { suppressedCount, activeCount } = useMemo(() => {
    const suppressed = violations.filter((v) => v.analysis.isSuppressed).length;
    return { suppressedCount: suppressed, activeCount: violations.length - suppressed };
  }, [violations]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Policy Violations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground p-8 text-center text-lg">Loading policy violations...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Policy Violations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Error loading policy violations:</strong> {String(error)}
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
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Policy Violations
            </CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {activeCount} active violation{activeCount !== 1 ? "s" : ""}
              {suppressedCount > 0 && `, ${suppressedCount} suppressed`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="show-suppressed-violations" checked={showSuppressed} onCheckedChange={setShowSuppressed} />
            <Label htmlFor="show-suppressed-violations" className="cursor-pointer">
              Show suppressed
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayedViolations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">No policy violations found</p>
            <p className="text-muted-foreground text-sm">
              {showSuppressed
                ? "This project has no policy violations."
                : "This project has no active policy violations. Toggle 'Show suppressed' to view suppressed violations."}
            </p>
          </div>
        ) : (
          <DataTable id="project-violations-table" data={displayedViolations} columns={columns} isLoading={isLoading} />
        )}
      </CardContent>
    </Card>
  );
}
