import React from "react";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import { Checkbox } from "@/core/components/ui/checkbox";
import { FormField } from "@/core/components/ui/form-field";
import { Label } from "@/core/components/ui/label";

export interface FormCheckboxProps {
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({ label, helperText, disabled = false }) => {
  // Access field from context - fully typed!
  const field = useFieldContext<boolean>();

  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const isTouched = field.state.meta.isTouched;
  const hasError = isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);
  const checked = field.state.value ?? false;

  return (
    <FormField
      label={undefined} // Checkbox label is handled separately
      helperText={hasError ? errorMessage : helperText}
      error={hasError ? errorMessage : undefined}
      id={fieldId}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          checked={checked}
          onCheckedChange={(checked) => {
            field.handleChange(checked as boolean);
          }}
          onBlur={field.handleBlur}
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
  );
};
