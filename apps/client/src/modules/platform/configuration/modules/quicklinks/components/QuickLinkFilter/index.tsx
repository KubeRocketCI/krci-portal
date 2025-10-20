import { TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { QUICKLINK_LIST_FILTER_NAMES } from "./constants";
import { useQuickLinkFilter } from "./hooks/useFilter";

export const QuickLinkFilter = () => {
  const { form, reset } = useQuickLinkFilter();

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={QUICKLINK_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search quick links" />}
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
