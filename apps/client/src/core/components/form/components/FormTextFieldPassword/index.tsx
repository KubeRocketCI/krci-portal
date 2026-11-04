import React from "react";
import { InputPassword } from "@/core/components/ui/input-password";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";

export interface FormTextFieldPasswordProps {
  label?: string;
  tooltipText?: string;
  helperText?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const FormTextFieldPassword: React.FC<FormTextFieldPasswordProps> = ({
  label,
  tooltipText,
  helperText,
  placeholder,
  disabled = false,
  inputProps = {},
}) => {
  const field = useFieldContext();
  const fieldId = React.useId();

  const value = (field.state.value ?? "") as string;
  const errors = field.state.meta.errors;
  const hasError = field.state.meta.isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);

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
        value,
        onChange: (e) => field.handleChange(e.target.value),
        onBlur: field.handleBlur,
        placeholder,
        "aria-describedby": helperText || hasError ? `${fieldId}-helper` : undefined,
      }}
    />
  );
};
