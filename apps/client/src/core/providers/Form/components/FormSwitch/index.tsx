import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Switch } from "@/core/components/ui/switch";
import { FormSwitchProps } from "./types";

const FormSwitchInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
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
    const fieldId = React.useId();

    return (
      <Controller
        render={({ field }) => {
          const { value, onChange, ...fieldProps } = field;
          return (
            <Switch
              {...fieldProps}
              ref={ref}
              checked={!!value}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={disabled}
              id={fieldId}
              invalid={hasError}
            />
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

FormSwitchInner.displayName = "FormSwitch";

export const FormSwitch = FormSwitchInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormSwitchProps<TFormValues> & { ref?: React.ForwardedRef<HTMLButtonElement> }
) => React.JSX.Element;

