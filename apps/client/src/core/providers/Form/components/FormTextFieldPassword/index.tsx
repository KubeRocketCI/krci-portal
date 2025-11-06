import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { InputPassword } from "@/core/components/ui/input-password";
import { FormTextFieldPasswordProps } from "./types";

const FormTextFieldPasswordInner = React.forwardRef(
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
      ...props
    }: FormTextFieldPasswordProps<TFormValues>,
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
          <InputPassword
            label={label}
            tooltipText={tooltipText}
            helperText={helperText}
            error={hasError ? errorMessage : undefined}
            disabled={disabled}
            id={fieldId}
            inputProps={{
              ...inputProps,
              ...field,
              value: (field.value ?? "") as string,
              placeholder,
              "aria-describedby": helperText || hasError ? `${fieldId}-helper` : undefined,
            }}
            ref={ref}
          />
        )}
        {...props}
      />
    );
  }
);

FormTextFieldPasswordInner.displayName = "FormTextFieldPassword";

export const FormTextFieldPassword = FormTextFieldPasswordInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormTextFieldPasswordProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
