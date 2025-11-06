import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Codebase } from "@my-project/shared";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { CodebaseActionsMenu } from "@/modules/platform/codebases/components/CodebaseActionsMenu";

export const Actions = ({
  resource,
  disabled,
}: {
  resource: Codebase;
  disabled?: {
    boolean: boolean;
    reason: string;
  };
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <ConditionalWrapper
        condition={!!disabled?.boolean}
        wrapper={(children) => (
          <Tooltip title={disabled?.reason}>
            <div>{children}</div>
          </Tooltip>
        )}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={"Options"} disabled={disabled?.boolean}>
            <EllipsisVertical width={20} height={20} />
          </Button>
        </DropdownMenuTrigger>
      </ConditionalWrapper>
      {!disabled?.boolean && (
        <CodebaseActionsMenu
          variant="menu"
          data={{
            codebase: resource,
          }}
        />
      )}
    </DropdownMenu>
  );
};
