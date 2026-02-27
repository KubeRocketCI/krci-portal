import React from "react";
import { useFormContext } from "../../form-context";
import { Button, ButtonProps } from "@/core/components/ui/button";

export interface FormResetButtonProps extends Omit<ButtonProps, "type" | "onClick"> {
  children: React.ReactNode;
}

export const FormResetButton: React.FC<FormResetButtonProps> = ({ children, disabled, ...buttonProps }) => {
  // Access form from context
  const form = useFormContext();

  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={() => {
        form.reset();
      }}
      {...buttonProps}
    >
      {children}
    </Button>
  );
};
