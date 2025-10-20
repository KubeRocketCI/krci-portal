import { TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { PIPELINE_LIST_FILTER_NAMES } from "./constants";
import { usePipelineFilter } from "./hooks/useFilter";

export const PipelineFilter = () => {
  const { form, reset } = usePipelineFilter();

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={PIPELINE_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search pipelines" />}
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
