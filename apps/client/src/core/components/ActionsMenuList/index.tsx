import { Tooltip } from "@/core/components/ui/tooltip";
import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "@/core/components/ui/dropdown-menu";
import { ConditionalWrapper } from "../ConditionalWrapper";
import { ActionsMenuListProps } from "./types";
import { Link } from "@tanstack/react-router";

export const ActionsMenuList = ({ actions }: ActionsMenuListProps) => {
  return (
    <DropdownMenuContent align="end" className="w-auto">
      <DropdownMenuGroup>
        {actions.map(({ name, label, action, disabled, Icon, link }, idx) => {
          const actionId = `${name}:${idx}`;

          const menuItemContent = (
            <DropdownMenuItem disabled={disabled?.status} onClick={link ? undefined : action} asChild={!!link}>
              {link ? (
                <Link
                  to={link.to}
                  params={link.params}
                  className="flex items-center gap-2 no-underline"
                  onClick={(e) => {
                    if (disabled?.status) {
                      e.preventDefault();
                    } else {
                      action(e);
                    }
                  }}
                >
                  {Icon}
                  <span>{label}</span>
                </Link>
              ) : (
                <>
                  {Icon}
                  <span>{label}</span>
                </>
              )}
            </DropdownMenuItem>
          );

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
              {menuItemContent}
            </ConditionalWrapper>
          );
        })}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
};
