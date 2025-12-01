import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ActionsInlineListProps } from "./types";
import { Link } from "@tanstack/react-router";

export const ActionsInlineList = ({ actions }: ActionsInlineListProps) => {
  return (
    <div className="flex flex-row items-center gap-2">
      {actions.map(({ name, action, disabled, Icon, label, isTextButton, link }, idx) => {
        const actionId = `${name}:${idx}`;

        const buttonContent = isTextButton ? (
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
          <Button variant="ghost" size="icon" disabled={disabled?.status} onClick={action}>
            {Icon}
          </Button>
        );

        const wrappedContent = link ? (
          <Link
            to={link.to}
            params={link.params}
            className="no-underline"
            onClick={(e) => {
              if (disabled?.status) {
                e.preventDefault();
              } else {
                action(e);
              }
            }}
          >
            {buttonContent}
          </Link>
        ) : (
          buttonContent
        );

        return (
          <div key={actionId}>
            <Tooltip title={disabled?.reason || label}>
              <div>{wrappedContent}</div>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};
