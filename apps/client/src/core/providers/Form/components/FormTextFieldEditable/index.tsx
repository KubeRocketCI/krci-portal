import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { InputEditable } from "@/core/components/ui/input-editable";
import { FormTextFieldEditableProps } from "./types";

const FormTextFieldEditableInner = React.forwardRef(
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
      initiallyEditable = false,
      ...props
    }: FormTextFieldEditableProps<TFormValues>,
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

FormTextFieldEditableInner.displayName = "FormTextFieldEditable";

export const FormTextFieldEditable = FormTextFieldEditableInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormTextFieldEditableProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
