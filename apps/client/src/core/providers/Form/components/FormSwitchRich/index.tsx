import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { FormSwitchProps } from "./types";
import { cn } from "@/core/utils/classname";

const FormSwitchRichInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      helperText,
      control,
      errors,
      defaultValue = false,
      disabled,
      ...props
    }: FormSwitchProps<TFormValues>,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string | undefined;
    const fieldId = React.useId();
    const displayHelperText = errorMessage || helperText;

    return (
      <Controller
        render={({ field }) => {
          const { value, onChange, ...fieldProps } = field;
          const isChecked = !!value;
          return (
            <div
              className={cn(
                "border-input relative flex w-full items-start gap-2 rounded border p-4 shadow-xs outline-none",
                isChecked && "border-primary/50",
                hasError && "border-destructive",
                disabled && "opacity-50"
              )}
            >
              {(label || displayHelperText) && (
                <div className="flex grow items-center gap-3">
                  <div className="grid grow gap-2">
                    {label && (
                      <Label htmlFor={fieldId} className="cursor-pointer">
                        {label}
                      </Label>
                    )}
                    {displayHelperText && (
                      <p
                        id={`${fieldId}-description`}
                        className={cn("text-xs", hasError ? "text-destructive" : "text-muted-foreground")}
                      >
                        {displayHelperText}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <Switch
                {...fieldProps}
                ref={ref}
                checked={!!value}
                onCheckedChange={(checked) => onChange(checked)}
                disabled={disabled}
                id={fieldId}
                invalid={hasError}
                aria-describedby={displayHelperText ? `${fieldId}-description` : undefined}
              />
            </div>
          );
        }}
        defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
        name={name}
        control={control}
        {...props}
      />
    );
  }
);

FormSwitchRichInner.displayName = "FormSwitchRich";

export const FormSwitchRich = FormSwitchRichInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormSwitchProps<TFormValues> & { ref?: React.ForwardedRef<HTMLButtonElement> }
) => React.JSX.Element;
