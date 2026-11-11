import { SEVERITY_SERIES } from "../../constants";

export function SeverityLegend() {
  return (
    <ul aria-label="Severity legend" className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {SEVERITY_SERIES.map(({ key, label, color }) => (
        <li key={key} className="flex items-center gap-1.5 text-xs">
          <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
          <span className="text-muted-foreground">{label}</span>
        </li>
      ))}
    </ul>
  );
}
