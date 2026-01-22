import React from "react";
import { useFieldContext } from "../../form-context";
import { TextareaPassword } from "@/core/components/ui/textarea-password";

export interface FormTextareaPasswordProps {
  label?: string;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  disabled?: boolean;
  rows?: number;
  showToggle?: boolean;
  textareaProps?: React.ComponentProps<"textarea">;
}

export const FormTextareaPassword: React.FC<FormTextareaPasswordProps> = ({
  label,
  placeholder,
  tooltipText,
  helperText,
  disabled = false,
  rows,
  showToggle = true,
  textareaProps = {},
}) => {
  // Access field from context - fully typed!
  const field = useFieldContext<string>();

  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const hasError = errors.length > 0;
  const errorMessage = errors[0] as string | undefined;
  const fieldValue = field.state.value ?? "";

  return (
    <TextareaPassword
      label={label}
      tooltipText={tooltipText}
      helperText={helperText}
      error={hasError ? errorMessage : undefined}
      disabled={disabled}
      id={fieldId}
      value={fieldValue}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
        field.handleChange(e.target.value);
      }}
      showToggle={showToggle}
      textareaProps={{
        ...textareaProps,
        placeholder,
        rows,
        onBlur: field.handleBlur,
        "aria-describedby": helperText || hasError ? `${fieldId}-helper` : undefined,
      }}
    />
  );
};
