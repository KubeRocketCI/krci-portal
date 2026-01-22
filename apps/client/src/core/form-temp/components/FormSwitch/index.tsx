import React from "react";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { cn } from "@/core/utils/classname";

export interface FormSwitchProps {
  label?: React.ReactNode;
  helperText?: string;
  description?: React.ReactNode; // For rich variant
  disabled?: boolean;
  rich?: boolean; // Enable rich variant with description
  icon?: React.ReactNode; // For rich variant
  variant?: "card" | "list"; // For rich variant
  expandableContent?: React.ReactNode; // For rich variant
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
  label,
  helperText,
  description,
  disabled = false,
  rich = false,
  icon,
  variant = "card",
  expandableContent,
}) => {
  // Access field from context - fully typed!
  const field = useFieldContext<boolean>();

  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const isTouched = field.state.meta.isTouched;
  const hasError = isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);
  const checked = field.state.value ?? false;
  const displayHelperText = errorMessage || helperText || description;

  // Rich variant
  if (rich) {
    if (variant === "list") {
      return (
        <div className="space-y-4">
          <Label htmlFor={fieldId} className="flex w-full cursor-pointer items-center gap-4">
            <Switch
              checked={checked}
              onCheckedChange={(checked) => {
                field.handleChange(checked as boolean);
              }}
              onBlur={field.handleBlur}
              disabled={disabled}
              id={fieldId}
              invalid={hasError}
              aria-describedby={displayHelperText ? `${fieldId}-description` : undefined}
            />
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-4">
                {icon && <div className="size-4">{icon}</div>}
                {label}
              </span>
              {displayHelperText && (
                <p
                  id={`${fieldId}-description`}
                  className={cn("text-xs font-normal", hasError ? "text-destructive" : "text-muted-foreground")}
                >
                  {displayHelperText}
                </p>
              )}
            </div>
          </Label>
          {checked && expandableContent && <div>{expandableContent}</div>}
        </div>
      );
    }

    // Card variant
    return (
      <div className={cn("rounded-md border outline-none", hasError && "border-destructive")}>
        <div className="space-y-4 p-3">
          <div className="flex w-full items-start gap-4">
            <Switch
              checked={checked}
              onCheckedChange={(checked) => {
                field.handleChange(checked as boolean);
              }}
              onBlur={field.handleBlur}
              disabled={disabled}
              id={fieldId}
              invalid={hasError}
              aria-describedby={displayHelperText ? `${fieldId}-description` : undefined}
            />
            <div className="flex grow items-center gap-3">
              {icon && <div className="size-5">{icon}</div>}
              <div className="flex flex-col gap-1">
                {label && (
                  <Label htmlFor={fieldId} className="cursor-pointer">
                    {label}
                  </Label>
                )}
                {displayHelperText && (
                  <p
                    id={`${fieldId}-description`}
                    className={cn("text-xs font-normal", hasError ? "text-destructive" : "text-muted-foreground")}
                  >
                    {displayHelperText}
                  </p>
                )}
              </div>
            </div>
          </div>
          {checked && expandableContent && <div>{expandableContent}</div>}
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <Switch
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
  );
};
