import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { ConditionalWrapper } from "../ConditionalWrapper";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/core/components/ui/button";

type ButtonVariantProps = React.ComponentProps<typeof Button> & VariantProps<typeof buttonVariants>;

export const ButtonWithPermission = React.forwardRef<
  HTMLButtonElement,
  {
    allowed: boolean;
    reason?: string;
    ButtonProps: ButtonVariantProps;
    children: React.ReactNode;
  } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">
>(({ allowed, reason = "Forbidden", ButtonProps, children, ...rest }, ref) => {
  const { onClick, disabled, ...restButtonProps } = ButtonProps ?? {};
  return (
    <ConditionalWrapper condition={!allowed} wrapper={(children) => <Tooltip title={reason}>{children}</Tooltip>}>
      <Button ref={ref} {...restButtonProps} {...rest} onClick={onClick} disabled={disabled || !allowed}>
        {children}
      </Button>
    </ConditionalWrapper>
  );
});

ButtonWithPermission.displayName = "ButtonWithPermission";
