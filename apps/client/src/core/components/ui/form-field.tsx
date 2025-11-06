"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Label } from "@/core/components/ui/label";
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";

export interface FormFieldProps {
  label?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  error?: string | boolean;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, tooltipText, helperText, error, required, disabled, children, className, id, prefix, suffix }, ref) => {
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
            {tooltipText && (
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
        <div className="group focus-within:ring-ring/50 inline-flex items-stretch rounded shadow-xs focus-within:ring-[3px]">
          {prefix && (
            <div
              className={cn(
                "text-muted-foreground border-input flex items-stretch rounded-l border border-r-0 shadow-xs transition-[border-color]",
                "*:rounded-none *:border-0 *:shadow-none",
                "group-focus-within:border-ring",
                hasError && "border-destructive group-focus-within:border-destructive"
              )}
            >
              {prefix}
            </div>
          )}
          <div
            className={cn(
              "flex flex-1 items-center",
              !prefix && !suffix && "border-input rounded border",
              prefix && !suffix && "border-input rounded-r border-t border-r border-b",
              !prefix && suffix && "border-input rounded-l border-t border-b border-l",
              prefix && suffix && "border-input border-t border-b",
              "group-focus-within:border-ring",
              hasError && "border-destructive group-focus-within:border-destructive"
            )}
          >
            {children}
          </div>
          {suffix && (
            <div
              className={cn(
                "border-input flex items-stretch rounded-r border px-0 transition-[border-color]",
                "*:h-full *:rounded-none *:border-0 *:shadow-none",
                "group-focus-within:border-ring",
                hasError && "border-destructive group-focus-within:border-destructive"
              )}
            >
              {suffix}
            </div>
          )}
        </div>
        {displayHelperText && (
          <FormHelperText id={`${finalId}-helper`} error={hasError}>
            {displayHelperText}
          </FormHelperText>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export interface FormLabelProps extends Omit<React.ComponentProps<typeof Label>, "children"> {
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const FormLabel = React.forwardRef<React.ElementRef<typeof Label>, FormLabelProps>(
  ({ className, required, disabled, children, ...props }, ref) => {
    return (
      <Label
        ref={ref}
        className={cn("flex items-center gap-2", disabled && "cursor-not-allowed opacity-50", className)}
        {...props}
      >
        {children}
        {required && <span className="text-destructive">*</span>}
      </Label>
    );
  }
);

FormLabel.displayName = "FormLabel";

export interface FormHelperTextProps extends React.ComponentProps<"p"> {
  error?: boolean;
}

export const FormHelperText = React.forwardRef<HTMLParagraphElement, FormHelperTextProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground", className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

FormHelperText.displayName = "FormHelperText";
