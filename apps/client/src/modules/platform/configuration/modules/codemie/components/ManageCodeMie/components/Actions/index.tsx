import { Button, Stack, Tooltip } from "@mui/material";
import { useFormsContext } from "../../hooks/useFormsContext";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";

export const Actions = () => {
  const { forms, resetAll, submitAll, isAnyFormDirty, isAnyFormSubmitting, isAnyFormForbiddenToSubmit } =
    useFormsContext();

  const submitDisabledTooltip = isAnyFormForbiddenToSubmit
    ? Object.values(forms).find((form) => !form.allowedToSubmit.isAllowed)?.allowedToSubmit.reason
    : "";

  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ justifyContent: "flex-end" }}>
      <Button
        onClick={resetAll}
        size="small"
        component={"button"}
        disabled={!isAnyFormDirty}
        sx={{ ml: "auto !important" }}
      >
        undo changes
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
          size={"small"}
          component={"button"}
          variant={"contained"}
          color={"primary"}
          disabled={!isAnyFormDirty || isAnyFormSubmitting || isAnyFormForbiddenToSubmit}
        >
          save
        </Button>
      </ConditionalWrapper>
    </Stack>
  );
};
