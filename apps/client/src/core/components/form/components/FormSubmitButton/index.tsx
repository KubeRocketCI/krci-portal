import React from "react";
import { useFormContext } from "../../form-context";
import { Button, ButtonProps } from "@/core/components/ui/button";

export interface FormSubmitButtonProps extends Omit<ButtonProps, "type" | "onClick"> {
  children: React.ReactNode;
}

export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({ children, disabled, ...buttonProps }) => {
  // Access form from context
  const form = useFormContext();

  const isSubmitting = form.state.isSubmitting;
  const canSubmit = form.state.canSubmit;

  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting || !canSubmit}
      onClick={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      {...buttonProps}
    >
      {children}
    </Button>
  );
};
