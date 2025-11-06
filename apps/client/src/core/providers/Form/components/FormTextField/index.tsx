import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Input } from "@/core/components/ui/input";
import { FormField } from "@/core/components/ui/form-field";
import { FormTextFieldProps } from "./types";

const FormTextFieldInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      helperText,
      control,
      defaultValue = "",
      errors,
      placeholder,
      disabled = false,
      inputProps = {},
      prefix,
      suffix,
      ...props
    }: FormTextFieldProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string | undefined;
    const fieldId = React.useId();

    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
        render={({ field }) => (
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
              {...field}
              value={(field.value ?? "") as string}
              ref={ref}
              id={fieldId}
              invalid={hasError}
              aria-describedby={helperText || hasError ? `${fieldId}-helper` : undefined}
              placeholder={placeholder}
              disabled={disabled}
            />
          </FormField>
        )}
        {...props}
      />
    );
  }
);

FormTextFieldInner.displayName = "FormTextField";

export const FormTextField = FormTextFieldInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormTextFieldProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
