import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { RadioGroupWithButtons } from "@/core/components/ui/radio-group-with-buttons";
import { FormFieldGroup } from "@/core/components/ui/form-field-group";
import { FormRadioGroupProps } from "./types";

const FormRadioGroupInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>({
    name,
    control,
    errors,
    label,
    tooltipText,
    helperText,
    options,
    disabled = false,
    defaultValue,
    className,
    ...props
  }: FormRadioGroupProps<TFormValues>) => {
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
          <FormFieldGroup
            label={label}
            tooltipText={tooltipText}
            error={hasError ? errorMessage : undefined}
            helperText={helperText}
            id={fieldId}
          >
            <RadioGroupWithButtons
              value={(field.value ?? "") as string}
              onValueChange={(value) => field.onChange(value)}
              disabled={disabled}
              options={options}
              className={className}
            />
          </FormFieldGroup>
        )}
        {...props}
      />
    );
  }
);

FormRadioGroupInner.displayName = "FormRadioGroup";

export const FormRadioGroup = FormRadioGroupInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormRadioGroupProps<TFormValues> & { ref?: React.ForwardedRef<HTMLButtonElement> }
) => React.JSX.Element;
