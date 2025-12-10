import { TextField, Select, SelectOption } from "@/core/components/form";
import { useFilterContext } from "@/core/providers/Filter";
import { codebaseType } from "@my-project/shared";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";

const codebaseTypeOptions: SelectOption[] = [
  { label: "All", value: "all" },
  ...Object.entries(codebaseType).map(([key, value]) => ({
    label: value,
    value: key,
  })),
];

export const TemplateFilter = () => {
  const { form, reset } = useFilterContext();

  return (
    <>
      <div className="col-span-3">
        <form.Field
          name="search"
          listeners={{
            onChangeDebounceMs: 300,
          }}
        >
          {(field) => <TextField field={field} label="Search" placeholder="Search templates" />}
        </form.Field>
      </div>

      <div className="col-span-3">
        <form.Field name="codebaseType">
          {(field) => (
            <Select field={field} label="Codebase Type" options={codebaseTypeOptions} placeholder="Select type" />
          )}
        </form.Field>
      </div>

      {form.state.isDirty && (
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
};
