import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ActionsInlineListProps } from "./types";

export const ActionsInlineList = ({ actions }: ActionsInlineListProps) => {
  return (
    <div className="flex flex-row items-center gap-2">
      {actions.map(({ name, action, disabled, Icon, label, isTextButton }, idx) => {
        const actionId = `${name}:${idx}`;

        return isTextButton ? (
          <Button
            size="sm"
            onClick={action}
            variant="outline"
            disabled={disabled?.status}
            className="text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10"
          >
            {Icon}
            {name}
          </Button>
        ) : (
          <div key={actionId}>
            <Tooltip title={disabled?.reason || label}>
              <div>
                <Button variant="ghost" size="icon" disabled={disabled?.status} onClick={action}>
                  {Icon}
                </Button>
              </div>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};
