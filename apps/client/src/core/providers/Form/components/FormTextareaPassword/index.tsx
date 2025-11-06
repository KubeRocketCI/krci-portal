import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { TextareaPassword } from "@/core/components/ui/textarea-password";
import { FormTextareaPasswordProps } from "./types";

const FormTextareaPasswordInner = React.forwardRef(
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
    }: FormTextareaPasswordProps<TFormValues>,
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
          <TextareaPassword
            label={label}
            tooltipText={tooltipText}
            helperText={helperText}
            error={hasError ? errorMessage : undefined}
            disabled={disabled}
            id={fieldId}
            value={(field.value ?? "") as string}
            onChange={field.onChange}
            textareaProps={{
              ...textareaProps,
              placeholder,
              rows,
              "aria-describedby": helperText || hasError ? `${fieldId}-helper` : undefined,
            }}
            ref={ref}
          />
        )}
        {...props}
      />
    );
  }
);

FormTextareaPasswordInner.displayName = "FormTextareaPassword";

export const FormTextareaPassword = FormTextareaPasswordInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormTextareaPasswordProps<TFormValues> & { ref?: React.ForwardedRef<HTMLTextAreaElement> }
) => React.JSX.Element;
