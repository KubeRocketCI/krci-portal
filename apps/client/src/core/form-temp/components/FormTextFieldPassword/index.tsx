import React from "react";
import { InputPassword } from "@/core/components/ui/input-password";
import { useFieldContext } from "../../form-context";

export interface FormTextFieldPasswordProps {
  label?: string;
  tooltipText?: string;
  helperText?: string;
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
  const hasError = field.state.meta.errors?.length > 0;
  const errorMessage = field.state.meta.errors?.[0];

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
