import { Tooltip } from "@/core/components/ui/tooltip";
import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "@/core/components/ui/dropdown-menu";
import { ConditionalWrapper } from "../ConditionalWrapper";
import { ActionsMenuListProps } from "./types";

export const ActionsMenuList = ({ actions }: ActionsMenuListProps) => {
  return (
    <DropdownMenuContent align="end" className="w-auto">
      <DropdownMenuGroup>
        {actions.map(({ name, label, action, disabled, Icon }, idx) => {
          const actionId = `${name}:${idx}`;

          return (
            <ConditionalWrapper
              key={actionId}
              condition={!!disabled?.status}
              wrapper={(children) => (
                <Tooltip title={disabled?.reason}>
                  <div>{children}</div>
                </Tooltip>
              )}
            >
              <DropdownMenuItem disabled={disabled?.status} onClick={action}>
                {Icon}
                <span>{label}</span>
              </DropdownMenuItem>
            </ConditionalWrapper>
          );
        })}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
};
