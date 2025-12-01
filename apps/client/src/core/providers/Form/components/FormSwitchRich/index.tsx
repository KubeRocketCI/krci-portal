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
      icon,
      variant = "card",
      expandableContent,
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

          if (variant === "list") {
            return (
              <div className="space-y-4">
                <Label htmlFor={fieldId} className="flex w-full cursor-pointer items-center gap-4">
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
                {!!value && expandableContent && <div>{expandableContent}</div>}
              </div>
            );
          }

          return (
            <div className={cn("rounded-md border outline-none", hasError && "border-destructive")}>
              <div className="space-y-4 p-3">
                <div className="flex w-full items-start gap-4">
                  <Switch
                    {...fieldProps}
                    ref={ref}
                    checked={isChecked}
                    onCheckedChange={(checked) => onChange(checked)}
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
                {isChecked && expandableContent && <div>{expandableContent}</div>}
              </div>
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
