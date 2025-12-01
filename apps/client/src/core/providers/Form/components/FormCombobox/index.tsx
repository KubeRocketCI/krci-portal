import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Combobox, ComboboxOption } from "@/core/components/ui/combobox";
import { ComboboxWithInput } from "@/core/components/ui/combobox-with-input";
import { FormField } from "@/core/components/ui/form-field";
import { FormComboboxProps } from "./types";
import { Loader2 } from "lucide-react";

const FormComboboxInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      helperText,
      control,
      defaultValue = "",
      errors,
      options = [],
      placeholder = "Select option...",
      searchPlaceholder = "Search...",
      emptyText = "No option found.",
      disabled = false,
      freeSolo = false,
      loading = false,
      suffix,
      renderOption,
      ...props
    }: FormComboboxProps<TFormValues>,
    ref: React.ForwardedRef<HTMLButtonElement | HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string | undefined;
    const fieldId = React.useId();

    // Convert SelectOption[] to ComboboxOption[]
    const comboboxOptions: ComboboxOption[] = React.useMemo(
      () =>
        options.map((option) => ({
          value: option.value,
          label: option.label,
          disabled: option.disabled,
          icon: option.icon,
        })),
      [options]
    );

    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
        render={({ field }) => {
          const fieldValue = (field.value ?? "") as string;

          if (freeSolo) {
            return (
              <FormField
                label={label}
                tooltipText={tooltipText}
                error={hasError ? errorMessage : undefined}
                helperText={helperText}
                id={fieldId}
                suffix={
                  loading ? (
                    <div className="flex items-center px-2">
                      <Loader2 className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : (
                    suffix
                  )
                }
              >
                <ComboboxWithInput
                  ref={ref as React.ForwardedRef<HTMLInputElement>}
                  id={fieldId}
                  value={fieldValue}
                  onValueChange={(value) => field.onChange(value)}
                  options={comboboxOptions}
                  placeholder={placeholder}
                  emptyText={emptyText}
                  disabled={disabled || loading}
                  invalid={hasError}
                  renderOption={renderOption}
                />
              </FormField>
            );
          }

          return (
            <FormField
              label={label}
              tooltipText={tooltipText}
              error={hasError ? errorMessage : undefined}
              helperText={helperText}
              id={fieldId}
              suffix={
                loading ? (
                  <div className="bg-input flex items-center px-2">
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                  </div>
                ) : (
                  suffix
                )
              }
            >
              <Combobox
                ref={ref as React.ForwardedRef<HTMLButtonElement>}
                id={fieldId}
                options={comboboxOptions}
                value={fieldValue}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    field.onChange(value);
                  }
                }}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyText={emptyText}
                disabled={disabled || loading}
                multiple={false}
              />
            </FormField>
          );
        }}
        {...props}
      />
    );
  }
);

FormComboboxInner.displayName = "FormCombobox";

export const FormCombobox = FormComboboxInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormComboboxProps<TFormValues> & { ref?: React.ForwardedRef<HTMLButtonElement> }
) => React.JSX.Element;
