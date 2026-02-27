import { Button } from "@/core/components/ui/button";
import { QUICKLINK_LIST_FILTER_NAMES } from "./constants";
import { useQuickLinkFilter } from "./hooks/useFilter";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";

export const QuickLinkFilter = () => {
  const { form, reset } = useQuickLinkFilter();

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={QUICKLINK_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder="Search quick links" />}
        </form.AppField>
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
