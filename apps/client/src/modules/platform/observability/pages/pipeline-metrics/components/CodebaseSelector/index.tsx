import { Combobox, ComboboxOption } from "@/core/components/ui/combobox";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useMemo } from "react";

export interface CodebaseSelectorProps {
  namespace: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const ALL_CODEBASES_VALUE = "";

export function CodebaseSelector({ namespace, value, onChange }: CodebaseSelectorProps) {
  const codebaseListWatch = useCodebaseWatchList({ namespace });

  const options: ComboboxOption[] = useMemo(() => {
    const codebaseOptions = codebaseListWatch.data.array.map((codebase) => ({
      value: codebase.metadata.name,
      label: codebase.metadata.name,
    }));

    return [{ value: ALL_CODEBASES_VALUE, label: "All Codebases" }, ...codebaseOptions];
  }, [codebaseListWatch.data.array]);

  const handleChange = (selected: string | string[]) => {
    const selectedValue = Array.isArray(selected) ? selected[0] : selected;
    onChange(selectedValue === ALL_CODEBASES_VALUE ? undefined : selectedValue);
  };

  return (
    <div className="w-48">
      <Combobox
        options={options}
        value={value ?? ALL_CODEBASES_VALUE}
        onValueChange={handleChange}
        placeholder="Select codebase"
        searchPlaceholder="Search codebases..."
        emptyText="No codebases found"
        disabled={codebaseListWatch.query.isFetching}
      />
    </div>
  );
}
