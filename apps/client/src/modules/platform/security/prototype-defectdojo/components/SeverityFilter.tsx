// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { PrototypeDefectDojoSeverity } from "@my-project/shared";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { PROTOTYPE_SEVERITY_KEYS } from "../constants";

const ALL = "All";

export interface SeverityFilterProps {
  /** `undefined`: every severity. */
  value: PrototypeDefectDojoSeverity | undefined;
  onChange: (value: PrototypeDefectDojoSeverity | undefined) => void;
}

/** One-of severity filter. Clicking the selected severity returns to "All". */
export function SeverityFilter({ value, onChange }: SeverityFilterProps) {
  return (
    <ToggleButtonGroup<PrototypeDefectDojoSeverity | typeof ALL>
      value={value ?? ALL}
      aria-label="Severity"
      onChange={(_event, next) => onChange(next === null || next === ALL ? undefined : next)}
    >
      {[
        <ToggleButton key={ALL} value={ALL}>
          All
        </ToggleButton>,
        ...PROTOTYPE_SEVERITY_KEYS.map(({ severity }) => (
          <ToggleButton key={severity} value={severity}>
            {severity}
          </ToggleButton>
        )),
      ]}
    </ToggleButtonGroup>
  );
}
