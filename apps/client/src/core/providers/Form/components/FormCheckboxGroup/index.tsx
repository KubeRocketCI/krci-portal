import React, { type ReactNode } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";
import {
  CheckboxGroupWithButtons,
  CheckboxGroupButtonIcon,
  CheckboxGroupVariant,
} from "@/core/components/ui/checkbox-group-with-buttons";
import { FormFieldGroup } from "@/core/components/ui/form-field-group";
import { FormFieldProps } from "@/core/components/ui/form-field";
import { FieldEvent } from "@/core/types/forms";

export interface FormCheckboxOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: CheckboxGroupButtonIcon;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface FormCheckboxGroupProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  // Controller props
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  defaultValue?: string[];

  // FormField props
  label?: FormFieldProps["label"];
  tooltipText?: FormFieldProps["tooltipText"];
  helperText?: FormFieldProps["helperText"];

  // CheckboxGroup props
  options: FormCheckboxOption[];
  disabled?: boolean;
  className?: string;
  variant?: CheckboxGroupVariant;
}

const FormCheckboxGroupInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>({
    name,
    control,
    errors,
    label,
    tooltipText,
    helperText,
    options,
    disabled = false,
    defaultValue = [],
    variant = "horizontal",
    className,
    rules,
    ...props
  }: FormCheckboxGroupProps<TFormValues>) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string | undefined;
    const fieldId = React.useId();

    return (
      <Controller
        name={name}
        control={control}
        defaultValue={(defaultValue || []) as PathValue<TFormValues, Path<TFormValues>>}
        rules={rules}
        render={({ field }) => {
          const handleChange = (value: string[]) => {
            const previousValue = (field.value ?? []) as string[];
            field.onChange(value);
            // Call onChange from rules if provided
            if (rules?.onChange) {
              const event: FieldEvent<string[]> = {
                target: {
                  name: name,
                  value: value,
                  previousValue: previousValue,
                } as FieldEvent<string[]>["target"] & { previousValue: string[] },
              };
              rules.onChange(event);
            }
          };

          return (
            <FormFieldGroup
              label={label}
              tooltipText={tooltipText}
              error={hasError ? errorMessage : undefined}
              helperText={helperText}
              id={fieldId}
            >
              <CheckboxGroupWithButtons
                value={(field.value ?? []) as string[]}
                onValueChange={handleChange}
                disabled={disabled}
                options={options}
                className={className}
                variant={variant}
              />
            </FormFieldGroup>
          );
        }}
        {...props}
      />
    );
  }
);

FormCheckboxGroupInner.displayName = "FormCheckboxGroup";

export const FormCheckboxGroup = FormCheckboxGroupInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormCheckboxGroupProps<TFormValues> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.JSX.Element;
