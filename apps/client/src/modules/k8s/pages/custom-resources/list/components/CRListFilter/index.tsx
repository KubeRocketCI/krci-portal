import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import type { SelectOption } from "@/core/components/form";
import { sortByName } from "@/core/utils/sortByName";
import { extractByJsonPath } from "@/modules/k8s/utils/extractByJsonPath";
import type { KubeObjectBase } from "@my-project/shared";
import { crListFilterControlNames, type PrinterColMeta } from "./constants";
import { printerColumnFilterKey } from "./types";
import { useCRListFilter } from "./hooks/useCRListFilter";

interface Props {
  items: KubeObjectBase[];
  printerCols: PrinterColMeta[];
}

export function CRListFilter({ items, printerCols }: Props) {
  const { form, reset, isDefaultValue } = useCRListFilter();

  // Build the option set for each multi-select from live items so newly arriving
  // distinct values become selectable. The set of *columns* is frozen upstream
  // (see frozenAutoColsRef in view.tsx), so the column layout stays stable while
  // option lists grow as the watch streams in.
  const optionsByCol = useMemo(() => {
    const map = new Map<string, SelectOption[]>();
    for (const col of printerCols) {
      const distinct = new Set<string>();
      for (const item of items) {
        const v = extractByJsonPath(item, col.jsonPath);
        if (v != null) distinct.add(String(v));
      }
      const opts: SelectOption[] = Array.from(distinct)
        .sort(sortByName)
        .map((value) => ({ label: value, value }));
      map.set(col.name, opts);
    }
    return map;
  }, [items, printerCols]);

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={crListFilterControlNames.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder="Search resources" />}
        </form.AppField>
      </div>

      {printerCols.map((col) => (
        <div className="col-span-2" key={col.name}>
          <form.AppField name={printerColumnFilterKey(col.name)}>
            {(field) => (
              <field.FormCombobox
                label={col.name}
                placeholder={`Select ${col.name.toLowerCase()}`}
                options={optionsByCol.get(col.name) ?? []}
                multiple
              />
            )}
          </form.AppField>
        </div>
      ))}

      {!isDefaultValue && (
        <div className="col-span-1 flex flex-col gap-2">
          <Label> </Label>
          <Button variant="secondary" onClick={reset} size="sm" className="mt-0.5">
            <X size={16} />
            Clear
          </Button>
        </div>
      )}
    </>
  );
}
