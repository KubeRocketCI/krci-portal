import React from "react";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { FormField } from "@/core/components/ui/form-field";
import { cn } from "@/core/utils/classname";
import type { SelectOption } from "../../types";

export interface FormSelectProps {
  label?: string;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  disabled?: boolean;
  options: SelectOption[];
  suffix?: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  placeholder,
  tooltipText,
  helperText,
  disabled = false,
  options,
  suffix,
}) => {
  // Access field from context - fully typed!
  const field = useFieldContext<string>();

  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const isTouched = field.state.meta.isTouched;
  const hasError = isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);
  const fieldValue = field.state.value ?? "";
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
      <Select
        value={fieldValue}
        onValueChange={(value) => {
          field.handleChange(value);
          // Trigger blur after value change
          setTimeout(() => field.handleBlur(), 0);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          className={cn("rounded border-0 shadow-none", !fieldValue && "text-muted-foreground")}
          aria-describedby={hasError ? `${fieldId}-helper` : undefined}
        >
          <div className="flex items-center gap-2">
            {currentOption?.icon && (
              <span className="flex size-4 shrink-0 items-center justify-center">{currentOption.icon}</span>
            )}
            <SelectValue placeholder={placeholder || label}>{displayValue}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map(({ label: optionLabel, value, disabled: optionDisabled = false, icon }, idx) => {
            const key = `${optionLabel}::${idx}`;
            return (
              <SelectItem key={key} value={value} disabled={optionDisabled} icon={icon}>
                {optionLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </FormField>
  );
};
