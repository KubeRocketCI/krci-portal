import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
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
  const { onClick, disabled, asChild, ...restButtonProps } = ButtonProps ?? {};
  const isDisabled = disabled || !allowed;

  return (
    <ConditionalWrapper
      condition={!allowed}
      wrapper={(children) => (
        <Tooltip title={reason}>
          <div>{children}</div>
        </Tooltip>
      )}
    >
      <Button
        ref={ref}
        {...restButtonProps}
        {...rest}
        asChild={asChild}
        onClick={onClick}
        disabled={!asChild && isDisabled}
        aria-disabled={asChild && isDisabled ? true : undefined}
        className={cn(
          ButtonProps?.className,
          rest.className,
          asChild && isDisabled && "pointer-events-none opacity-50"
        )}
      >
        {children}
      </Button>
    </ConditionalWrapper>
  );
});

ButtonWithPermission.displayName = "ButtonWithPermission";
