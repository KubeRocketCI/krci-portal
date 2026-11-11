import type { SecurityCounts } from "@my-project/shared";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { cn } from "@/core/utils/classname";
import { formatCount } from "@/modules/platform/security/components/defectdojo/utils";
import { SEVERITY_SERIES } from "../../constants";
import type { FindingsScope } from "../../utils";

const SCOPE_OPTIONS: ReadonlyArray<{ value: FindingsScope; label: string }> = [
  { value: "runtime", label: "Runtime" },
  { value: "ci", label: "CI" },
];

interface SecurityTotalsProps {
  counts: SecurityCounts;
  scope: FindingsScope;
  /** Scopes the summary has data for; the switch shows only when there is more than one. */
  availableScopes: FindingsScope[];
  onScopeChange: (scope: FindingsScope) => void;
}

/** Severity totals of one scope. Runtime and CI can report the same findings, so they are never summed. */
export function SecurityTotals({ counts, scope, availableScopes, onScopeChange }: SecurityTotalsProps) {
  return (
    <section aria-label="Severity totals" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {scope === "runtime" ? "Runtime totals" : "CI totals"}
        </h4>
        {availableScopes.length > 1 && (
          <div role="group" aria-label="Scope of totals and charts" className="inline-flex rounded-md border">
            {SCOPE_OPTIONS.filter(({ value }) => availableScopes.includes(value)).map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={scope === value ? "default" : "ghost"}
                aria-pressed={scope === value}
                onClick={() => onScopeChange(value)}
                className="h-7 rounded-none first:rounded-l-md last:rounded-r-md"
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>
      <ul className="flex flex-wrap gap-3">
        {SEVERITY_SERIES.map(({ key, label, color }) => (
          <li key={key} className="min-w-36 flex-1 basis-36">
            <Card
              className="border-l-4 px-4 py-3"
              style={{ borderLeftColor: color }}
              title={`${label}: ${counts[key].toLocaleString("en")}`}
            >
              <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</div>
              <div
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  counts[key] === 0 ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {formatCount(counts[key])}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
