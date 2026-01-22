import React from "react";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import {
  RadioGroupWithButtons,
  RadioGroupButtonIcon,
  RadioGroupVariant,
} from "@/core/components/ui/radio-group-with-buttons";
import { FormFieldGroup } from "@/core/components/ui/form-field-group";

export interface FormRadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: RadioGroupButtonIcon;
  checkedIcon?: React.ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface FormRadioGroupProps {
  label?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  options: FormRadioOption[];
  disabled?: boolean;
  variant?: RadioGroupVariant;
  className?: string;
}

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  label,
  tooltipText,
  helperText,
  options,
  disabled = false,
  variant = "horizontal",
  className,
}) => {
  // Access field from context - fully typed!
  const field = useFieldContext<string>();

  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const isTouched = field.state.meta.isTouched;
  const hasError = isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);
  const fieldValue = field.state.value ?? "";

  return (
    <FormFieldGroup
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={helperText}
      id={fieldId}
    >
      <RadioGroupWithButtons
        value={fieldValue}
        onValueChange={(value) => {
          field.handleChange(value);
        }}
        onBlur={field.handleBlur}
        disabled={disabled}
        options={options}
        className={className}
        variant={variant}
      />
    </FormFieldGroup>
  );
};
