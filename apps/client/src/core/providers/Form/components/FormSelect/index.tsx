import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { FormField } from "@/core/components/ui/form-field";
import { FormSelectProps } from "./types";
import { cn } from "@/core/utils/classname";

const FormSelectInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      helperText,
      control,
      defaultValue = "",
      errors,
      options = [],
      disabled = false,
      placeholder,
      suffix,
      ...props
    }: FormSelectProps<TFormValues>,
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
        render={({ field }) => {
          const fieldValue = (field.value ?? "") as string;
          const currentOption = options.find((option) => option.value === fieldValue);
          const displayValue = currentOption ? currentOption.label : placeholder || label || "";

          return (
            <FormField
              label={label}
              tooltipText={tooltipText}
              error={hasError ? errorMessage : undefined}
              helperText={helperText}
              id={fieldId}
              suffix={suffix}
            >
              <Select value={fieldValue} onValueChange={(value) => field.onChange(value)} disabled={disabled}>
                <SelectTrigger
                  ref={ref}
                  id={fieldId}
                  className={cn("rounded border-0 shadow-none", !field.value && "text-muted-foreground")}
                >
                  <div className="flex items-center gap-2">
                    {currentOption?.icon && (
                      <span className="flex size-4 shrink-0 items-center justify-center">{currentOption.icon}</span>
                    )}
                    <SelectValue placeholder={placeholder || label}>{displayValue}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {options.map(({ label, value, disabled: optionDisabled = false, icon }, idx) => {
                    const key = `${label}::${idx}`;
                    return (
                      <SelectItem key={key} value={value} disabled={optionDisabled} icon={icon}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormField>
          );
        }}
        {...props}
      />
    );
  }
);

FormSelectInner.displayName = "FormSelect";

export const FormSelect = FormSelectInner as <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
  props: FormSelectProps<TFormValues> & { ref?: React.ForwardedRef<HTMLButtonElement> }
) => React.JSX.Element;
