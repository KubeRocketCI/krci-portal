import { TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { TASK_LIST_FILTER_NAMES } from "./constants";
import { useTaskFilter } from "./hooks/useFilter";

export const TaskFilter = () => {
  const { form, reset } = useTaskFilter();

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={TASK_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search tasks" />}
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
