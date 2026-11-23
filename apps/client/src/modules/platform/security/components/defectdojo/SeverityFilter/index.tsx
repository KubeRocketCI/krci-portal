import { DEFECTDOJO_SEVERITIES, type DefectDojoSeverity } from "@my-project/shared";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";

const ALL = "All";

export interface SeverityFilterProps {
  /** `undefined`: every severity. */
  value: DefectDojoSeverity | undefined;
  onChange: (value: DefectDojoSeverity | undefined) => void;
}

/** One-of severity filter. Clicking the selected severity returns to "All". */
export function SeverityFilter({ value, onChange }: SeverityFilterProps) {
  return (
    <ToggleButtonGroup<DefectDojoSeverity | typeof ALL>
      value={value ?? ALL}
      aria-label="Severity"
      onChange={(_event, next) => onChange(next === null || next === ALL ? undefined : next)}
    >
      {[
        <ToggleButton key={ALL} value={ALL}>
          {ALL}
        </ToggleButton>,
        ...DEFECTDOJO_SEVERITIES.map((severity) => (
          <ToggleButton key={severity} value={severity}>
            {severity}
          </ToggleButton>
        )),
      ]}
    </ToggleButtonGroup>
  );
}
