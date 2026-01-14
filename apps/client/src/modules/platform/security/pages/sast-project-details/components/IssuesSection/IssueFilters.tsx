import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { IssueSeverity, ISSUE_SEVERITIES } from "@my-project/shared";
import { getSeverityConfig } from "../../utils/severityConfig";

interface IssueFiltersProps {
  severities: IssueSeverity[];
  onSeveritiesChange: (severities: IssueSeverity[]) => void;
}

export function IssueFilters({ severities, onSeveritiesChange }: IssueFiltersProps) {
  const toggleSeverity = (severity: IssueSeverity) => {
    if (severities.includes(severity)) {
      onSeveritiesChange(severities.filter((s) => s !== severity));
    } else {
      onSeveritiesChange([...severities, severity]);
    }
  };

  return (
    <div className="col-span-12">
      <Label>Filter by severity</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {ISSUE_SEVERITIES.map((severity) => {
          const config = getSeverityConfig(severity);
          const Icon = config.icon;
          const isSelected = severities.includes(severity);

          return (
            <Button
              key={severity}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeverity(severity)}
              className="gap-1"
            >
              <Icon className="h-3 w-3" />
              {severity}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
