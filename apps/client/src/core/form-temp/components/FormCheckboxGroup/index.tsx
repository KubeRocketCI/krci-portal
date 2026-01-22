import React from "react";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import {
  CheckboxGroupWithButtons,
  CheckboxGroupButtonIcon,
  CheckboxGroupVariant,
} from "@/core/components/ui/checkbox-group-with-buttons";
import { FormFieldGroup } from "@/core/components/ui/form-field-group";

export interface FormCheckboxOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: CheckboxGroupButtonIcon;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface FormCheckboxGroupProps {
  label?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  options: FormCheckboxOption[];
  disabled?: boolean;
  variant?: CheckboxGroupVariant;
  className?: string;
}

export const FormCheckboxGroup: React.FC<FormCheckboxGroupProps> = ({
  label,
  tooltipText,
  helperText,
  options,
  disabled = false,
  variant = "horizontal",
  className,
}) => {
  // Access field from context - fully typed!
  const field = useFieldContext<string[]>();

  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const isTouched = field.state.meta.isTouched;
  const hasError = isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);
  const fieldValue = Array.isArray(field.state.value) ? field.state.value : [];

  return (
    <FormFieldGroup
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={helperText}
      id={fieldId}
    >
      <CheckboxGroupWithButtons
        value={fieldValue}
        onValueChange={(value) => {
          field.handleChange(value);
        }}
        disabled={disabled}
        options={options}
        className={className}
        variant={variant}
      />
    </FormFieldGroup>
  );
};
