import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useFormsContext } from "../../hooks/useFormsContext";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";

export const Actions = () => {
  const { forms, resetAll, submitAll, isAnyFormDirty, isAnyFormSubmitting, isAnyFormForbiddenToSubmit } =
    useFormsContext();

  const submitDisabledTooltip = isAnyFormForbiddenToSubmit
    ? Object.values(forms).find((form) => !form.allowedToSubmit.isAllowed)?.allowedToSubmit.reason
    : "";

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        onClick={resetAll}
        size="sm"
        variant="ghost"
        disabled={!isAnyFormDirty}
        className="ml-auto"
      >
        Undo Changes
      </Button>
      <ConditionalWrapper
        condition={isAnyFormForbiddenToSubmit}
        wrapper={(children) => (
          <Tooltip title={submitDisabledTooltip}>
            <div>{children}</div>
          </Tooltip>
        )}
      >
        <Button
          onClick={() => submitAll(true)}
          size={"sm"}
          variant={"default"}
          disabled={!isAnyFormDirty || isAnyFormSubmitting || isAnyFormForbiddenToSubmit}
        >
          Save
        </Button>
      </ConditionalWrapper>
    </div>
  );
};
