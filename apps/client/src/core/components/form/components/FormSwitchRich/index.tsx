import React from "react";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { cn } from "@/core/utils/classname";
import { useFieldContext } from "../../form-context";

export interface FormSwitchRichProps {
  label?: string;
  helperText?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: "card" | "list";
  expandableContent?: React.ReactNode;
}

export const FormSwitchRich: React.FC<FormSwitchRichProps> = ({
  label,
  helperText,
  disabled,
  icon,
  variant = "card",
  expandableContent,
}) => {
  const field = useFieldContext();
  const fieldId = React.useId();

  const value = field.state.value as boolean | undefined;
  const isChecked = !!value;
  const hasError = field.state.meta.errors?.length > 0;
  const errorMessage = field.state.meta.errors?.[0];
  const displayHelperText = errorMessage || helperText;

  const handleChange = (checked: boolean) => {
    field.handleChange(checked);
  };

  if (variant === "list") {
    return (
      <div className="space-y-4">
        <Label htmlFor={fieldId} className="flex w-full cursor-pointer items-center gap-4">
          <Switch
            checked={isChecked}
            onCheckedChange={handleChange}
            disabled={disabled}
            id={fieldId}
            invalid={hasError}
            aria-describedby={displayHelperText ? `${fieldId}-description` : undefined}
            onBlur={field.handleBlur}
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
        {isChecked && expandableContent && <div>{expandableContent}</div>}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border outline-none", hasError && "border-destructive")}>
      <div className="space-y-4 p-3">
        <div className="flex w-full items-start gap-4">
          <Switch
            checked={isChecked}
            onCheckedChange={handleChange}
            disabled={disabled}
            id={fieldId}
            invalid={hasError}
            aria-describedby={displayHelperText ? `${fieldId}-description` : undefined}
            onBlur={field.handleBlur}
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
        {isChecked && expandableContent && <div>{expandableContent}</div>}
      </div>
    </div>
  );
};
