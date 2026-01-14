import { Badge } from "@/core/components/ui/badge";
import { SonarQubeIssue, IssueComponent } from "@my-project/shared";
import { getSeverityConfig } from "../../utils/severityConfig";
import { formatDebtTime, formatDate } from "../../utils/formatters";

interface IssueDetailContentProps {
  issue: SonarQubeIssue;
  components?: IssueComponent[];
}

function getComponentName(componentKey: string, components?: IssueComponent[]): string {
  if (!components) return componentKey;

  const component = components.find((c) => c.key === componentKey);
  return component?.path || component?.name || componentKey;
}

function getTypeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  const typeMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    BUG: "destructive",
    VULNERABILITY: "destructive",
    CODE_SMELL: "secondary",
  };
  return typeMap[type] || "outline";
}

export function IssueDetailContent({ issue, components }: IssueDetailContentProps) {
  const severityConfig = getSeverityConfig(issue.severity);
  const SeverityIcon = severityConfig.icon;
  const componentName = getComponentName(issue.component, components);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={severityConfig.badgeVariant} className="gap-1">
          <SeverityIcon className="h-3 w-3" />
          {issue.severity}
        </Badge>
        <Badge variant={getTypeVariant(issue.type)}>{issue.type}</Badge>
      </div>

      <div className="text-base">{issue.message}</div>

      <div className="space-y-4">
        <div className="space-y-1">
          <span className="text-sm font-semibold">File:</span>
          <p className="text-muted-foreground text-sm break-all">
            {componentName}
            {issue.line && <span className="text-primary">:{issue.line}</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-semibold">Component Key:</span>
            <p className="text-muted-foreground text-sm break-all">{issue.component}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold">Rule:</span>
            <p className="text-muted-foreground text-sm">{issue.rule}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold">Status:</span>
            <p className="text-muted-foreground text-sm">{issue.status}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold">Effort:</span>
            <p className="text-muted-foreground text-sm">{formatDebtTime(issue.effort)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold">Created:</span>
            <p className="text-muted-foreground text-sm">{formatDate(issue.creationDate)}</p>
          </div>
          {issue.updateDate && (
            <div className="space-y-1">
              <span className="text-sm font-semibold">Updated:</span>
              <p className="text-muted-foreground text-sm">{formatDate(issue.updateDate)}</p>
            </div>
          )}
        </div>

        {issue.tags && issue.tags.length > 0 && (
          <div className="space-y-1">
            <span className="text-sm font-semibold">Tags:</span>
            <div className="flex flex-wrap gap-2">
              {issue.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
