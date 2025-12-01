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
  RadioGroupWithButtons,
  RadioGroupButtonIcon,
  RadioGroupVariant,
} from "@/core/components/ui/radio-group-with-buttons";
import { FormFieldGroup } from "@/core/components/ui/form-field-group";
import { FormFieldProps } from "@/core/components/ui/form-field";

export interface FormRadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: RadioGroupButtonIcon;
  checkedIcon?: ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface FormRadioGroupProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  // Controller props
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  defaultValue?: string;

  // FormField props
  label?: FormFieldProps["label"];
  tooltipText?: FormFieldProps["tooltipText"];
  helperText?: FormFieldProps["helperText"];

  // RadioGroup props
  options: FormRadioOption[];
  disabled?: boolean;
  className?: string;
  variant?: RadioGroupVariant;
}

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
    variant = "horizontal",
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
              variant={variant}
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
