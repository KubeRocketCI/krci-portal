import { TextField } from "@/core/components/form";
import { Button } from "@/core/components/ui/button";
import { QUICKLINK_LIST_FILTER_NAMES } from "./constants";
import { useQuickLinkFilter } from "./hooks/useFilter";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";

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
        <div className="flex flex-col gap-2">
          <Label> </Label>
          <Button variant="secondary" onClick={reset} size="sm" className="mt-0.5">
            <X size={16} />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};
