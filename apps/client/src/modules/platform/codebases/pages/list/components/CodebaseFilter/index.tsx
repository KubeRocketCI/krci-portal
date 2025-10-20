import { Select, SelectOption, TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { codebaseType } from "@my-project/shared";
import { CODEBASE_LIST_FILTER_NAMES } from "./constants";
import { useCodebaseFilter } from "./hooks/useFilter";

const codebaseTypeOptions: SelectOption[] = [
  { label: "All", value: "all" },
  ...Object.entries(codebaseType).map(([key, value]) => ({
    label: value,
    value: key,
  })),
];

export const CodebaseFilter = () => {
  const { form, reset } = useCodebaseFilter();

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={CODEBASE_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search components" />}
        </form.Field>
      </div>

      <div className="w-64">
        <form.Field name={CODEBASE_LIST_FILTER_NAMES.CODEBASE_TYPE}>
          {(field) => (
            <Select field={field} label="Codebase Type" options={codebaseTypeOptions} placeholder="Select type" />
          )}
        </form.Field>
      </div>

      {form.state.isDirty && (
        <div className="mt-4">
          <Button variant="outlined" onClick={reset} size="small">
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};
