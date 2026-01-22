import React from "react";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import { Textarea } from "@/core/components/ui/textarea";
import { FormField } from "@/core/components/ui/form-field";

export interface FormTextareaProps {
  label?: string;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  disabled?: boolean;
  rows?: number;
  textareaProps?: React.ComponentProps<typeof Textarea>;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  placeholder,
  tooltipText,
  helperText,
  disabled = false,
  rows,
  textareaProps = {},
}) => {
  // Access field from context - fully typed!
  const field = useFieldContext<string>();

  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const isTouched = field.state.meta.isTouched;
  const hasError = isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);
  const fieldValue = field.state.value ?? "";

  return (
    <FormField
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={helperText}
      id={fieldId}
    >
      <Textarea
        {...textareaProps}
        value={fieldValue}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          field.handleChange(e.target.value);
        }}
        onBlur={field.handleBlur}
        id={fieldId}
        invalid={hasError}
        aria-describedby={helperText || hasError ? `${fieldId}-helper` : undefined}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
      />
    </FormField>
  );
};
