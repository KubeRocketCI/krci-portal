import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Checkbox } from "@/core/components/ui/checkbox";
import { FormField } from "@/core/components/ui/form-field";
import { Label } from "@/core/components/ui/label";
import { FormCheckboxProps } from "./types";

const FormCheckboxInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      control,
      errors,
      defaultValue = false,
      disabled,
      helperText,
      ...props
    }: FormCheckboxProps<TFormValues>,
    ref: React.ForwardedRef<HTMLButtonElement>
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
            label={undefined} // Checkbox label is handled separately
            helperText={hasError ? errorMessage : helperText}
            error={hasError ? errorMessage : undefined}
            id={fieldId}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                ref={ref}
                checked={!!field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
                disabled={disabled}
                id={fieldId}
                invalid={hasError}
                aria-describedby={helperText || hasError ? `${fieldId}-helper` : undefined}
              />
              {label && (
                <Label htmlFor={fieldId} className="cursor-pointer">
                  {label}
                </Label>
              )}
            </div>
          </FormField>
        )}
        {...props}
      />
    );
  }
);

FormCheckboxInner.displayName = "FormCheckbox";

export const FormCheckbox = FormCheckboxInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormCheckboxProps<TFormValues> & { ref?: React.ForwardedRef<HTMLButtonElement> }
) => React.JSX.Element;
