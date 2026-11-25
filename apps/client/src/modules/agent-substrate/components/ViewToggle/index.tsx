import type React from "react";
import type { LucideIcon } from "lucide-react";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import type { ViewMode } from "@/core/providers/ViewMode/types";

export interface ViewToggleOption<View extends ViewMode> {
  value: View;
  label: string;
  icon: LucideIcon;
}

interface ViewToggleProps<View extends ViewMode> {
  view: View;
  options: readonly ViewToggleOption<View>[];
  /** Also called on a click on the pressed button, with that view. */
  onChange: (view: View) => void;
}

export function ViewToggle<View extends ViewMode>({ view, options, onChange }: ViewToggleProps<View>) {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, next: View | null) => onChange(next ?? view);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ToggleButtonGroup<View> value={view} onChange={handleChange} aria-label="View">
        {options.map(({ value, label, icon: Icon }) => (
          <ToggleButton key={value} value={value}>
            <Icon className="size-4" aria-hidden />
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
