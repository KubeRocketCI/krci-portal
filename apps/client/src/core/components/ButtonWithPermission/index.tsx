import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { ConditionalWrapper } from "../ConditionalWrapper";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/core/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button> & VariantProps<typeof buttonVariants>;

export const ButtonWithPermission = ({
  allowed,
  reason = "Forbidden",
  ButtonProps,
  children,
}: {
  allowed: boolean;
  reason: string;
  ButtonProps: ButtonProps;
  children: React.ReactNode;
}) => {
  return (
    <ConditionalWrapper condition={!allowed} wrapper={(children) => <Tooltip title={reason}>{children}</Tooltip>}>
      <Button {...ButtonProps} disabled={ButtonProps?.disabled || !allowed}>
        {children}
      </Button>
    </ConditionalWrapper>
  );
};
