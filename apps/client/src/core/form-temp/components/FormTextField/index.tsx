import React from "react";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import { Input } from "@/core/components/ui/input";
import { InputPassword } from "@/core/components/ui/input-password";
import { InputEditable } from "@/core/components/ui/input-editable";
import { FormField } from "@/core/components/ui/form-field";

export interface FormTextFieldProps {
  label?: string;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  disabled?: boolean;
  type?: "text" | "email" | "number" | "tel" | "url" | "password";
  editable?: boolean;
  initiallyEditable?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  inputProps?: React.ComponentProps<typeof Input>;
}

export const FormTextField: React.FC<FormTextFieldProps> = ({
  label,
  placeholder,
  tooltipText,
  helperText,
  disabled = false,
  type = "text",
  editable = false,
  initiallyEditable = false,
  prefix,
  suffix,
  inputProps = {},
}) => {
  // Access field from context - fully typed!
  const field = useFieldContext<string>();

  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const isTouched = field.state.meta.isTouched;
  const hasError = isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);
  const fieldValue = field.state.value ?? "";

  // Password variant
  if (type === "password") {
    return (
      <InputPassword
        label={label}
        tooltipText={tooltipText}
        helperText={helperText}
        error={hasError ? errorMessage : undefined}
        disabled={disabled}
        id={fieldId}
        inputProps={{
          ...inputProps,
          value: fieldValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            field.handleChange(e.target.value);
          },
          onBlur: field.handleBlur,
          placeholder,
          "aria-describedby": helperText || hasError ? `${fieldId}-helper` : undefined,
        }}
      />
    );
  }

  // Editable variant
  if (editable) {
    return (
      <InputEditable
        label={label}
        tooltipText={tooltipText}
        helperText={helperText}
        error={hasError ? errorMessage : undefined}
        disabled={disabled}
        id={fieldId}
        initiallyEditable={initiallyEditable}
        inputProps={{
          ...inputProps,
          value: fieldValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            field.handleChange(e.target.value);
          },
          onBlur: field.handleBlur,
          placeholder,
          "aria-describedby": helperText || hasError ? `${fieldId}-helper` : undefined,
        }}
      />
    );
  }

  // Standard text input
  return (
    <FormField
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={helperText}
      id={fieldId}
      prefix={prefix}
      suffix={suffix}
    >
      <Input
        {...inputProps}
        value={fieldValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          field.handleChange(e.target.value);
        }}
        onBlur={field.handleBlur}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        invalid={hasError}
        id={fieldId}
        aria-describedby={helperText || hasError ? `${fieldId}-helper` : undefined}
      />
    </FormField>
  );
};
