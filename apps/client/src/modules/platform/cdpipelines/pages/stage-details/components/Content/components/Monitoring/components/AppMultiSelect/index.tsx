import * as React from "react";
import { ComboboxMultipleWithInput } from "@/core/components/ui/combobox-multiple-with-input";
import type { ComboboxOption } from "@/core/components/ui/combobox";
import { Button } from "@/core/components/ui/button";
import { Filter as FilterIcon } from "lucide-react";
import type { AppMultiSelectProps } from "../../types";

export function AppMultiSelect({ selectedApps, availableApps, onChange, onClear }: AppMultiSelectProps) {
  const options: ComboboxOption[] = React.useMemo(
    () => availableApps.map((app) => ({ value: app, label: app })),
    [availableApps]
  );

  const isAll = selectedApps === null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAll && (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <FilterIcon className="size-3.5" />
          All applications
        </span>
      )}
      <div className="min-w-[260px]">
        <ComboboxMultipleWithInput
          value={selectedApps ?? []}
          onValueChange={(next) => (next.length === 0 ? onClear() : onChange(next))}
          options={options}
          placeholder={isAll ? "Filter applications…" : "Add application…"}
          emptyText="No applications match"
          maxShownItems={3}
        />
      </div>
      {!isAll && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Show all
        </Button>
      )}
    </div>
  );
}
