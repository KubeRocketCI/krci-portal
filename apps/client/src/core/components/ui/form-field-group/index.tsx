"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { FormLabel, FormHelperText } from "@/core/components/ui/form-field";
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/core/components/ui/tooltip";
import { useFormGuide } from "@/core/providers/FormGuide/hooks";
import { cn } from "@/core/utils/classname";

export interface FormFieldGroupProps {
  label?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  error?: string | boolean;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormFieldGroup = React.forwardRef<HTMLDivElement, FormFieldGroupProps>(
  ({ label, tooltipText, helperText, error, required, disabled, children, className, id }, ref) => {
    const { isOpen: isFormGuideOpen } = useFormGuide();
    const showTooltips = !isFormGuideOpen;
    const fieldId = React.useId();
    const finalId = id || fieldId;
    const hasError = !!error;
    const errorMessage = typeof error === "string" ? error : undefined;
    const displayHelperText = errorMessage || helperText;

    return (
      <div ref={ref} className={cn("flex flex-col gap-2", className)}>
        {label && (
          <FormLabel htmlFor={finalId} required={required} disabled={disabled}>
            {label}
            {tooltipText && showTooltips && (
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Info size={16} className="text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tooltipText}</TooltipContent>
              </TooltipRoot>
            )}
          </FormLabel>
        )}
        <div>{children}</div>
        {displayHelperText && (
          <FormHelperText id={`${finalId}-helper`} error={hasError}>
            {displayHelperText}
          </FormHelperText>
        )}
      </div>
    );
  }
);

FormFieldGroup.displayName = "FormFieldGroup";
