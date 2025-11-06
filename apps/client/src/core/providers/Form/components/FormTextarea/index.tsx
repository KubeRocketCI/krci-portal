import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Textarea } from "@/core/components/ui/textarea";
import { FormField } from "@/core/components/ui/form-field";
import { FormTextareaProps } from "./types";

const FormTextareaInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      helperText,
      control,
      defaultValue = "",
      errors,
      placeholder,
      disabled = false,
      rows,
      textareaProps = {},
      ...props
    }: FormTextareaProps<TFormValues>,
    ref: React.ForwardedRef<HTMLTextAreaElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string | undefined;
    const fieldId = React.useId();

    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
        render={({ field }) => (
          <FormField
            label={label}
            tooltipText={tooltipText}
            error={hasError ? errorMessage : undefined}
            helperText={helperText}
            id={fieldId}
          >
            <Textarea
              {...textareaProps}
              {...field}
              value={(field.value ?? "") as string}
              ref={ref}
              id={fieldId}
              invalid={hasError}
              aria-describedby={helperText || hasError ? `${fieldId}-helper` : undefined}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
            />
          </FormField>
        )}
        {...props}
      />
    );
  }
);

FormTextareaInner.displayName = "FormTextarea";

export const FormTextarea = FormTextareaInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormTextareaProps<TFormValues> & { ref?: React.ForwardedRef<HTMLTextAreaElement> }
) => React.JSX.Element;

