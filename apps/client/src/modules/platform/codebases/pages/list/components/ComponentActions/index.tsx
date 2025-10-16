import { IconButton, Tooltip } from "@mui/material";
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
  const buttonRef = React.createRef<HTMLButtonElement>();
  const [anchor, setAnchor] = React.useState<(EventTarget & HTMLButtonElement) | null>(null);

  return (
    <>
      <ConditionalWrapper
        condition={!!disabled?.boolean}
        wrapper={(children) => (
          <Tooltip title={disabled?.reason}>
            <div>{children}</div>
          </Tooltip>
        )}
      >
        <IconButton
          ref={buttonRef}
          aria-label={"Options"}
          onClick={(e) => setAnchor(e.currentTarget)}
          size="small"
          disabled={disabled?.boolean}
        >
          <EllipsisVertical width={20} height={20} />
        </IconButton>
      </ConditionalWrapper>
      {anchor && !disabled?.boolean ? (
        <CodebaseActionsMenu
          variant="menu"
          data={{
            codebase: resource,
          }}
          anchorEl={anchor}
          handleCloseResourceActionListMenu={() => setAnchor(null)}
        />
      ) : null}
    </>
  );
};
