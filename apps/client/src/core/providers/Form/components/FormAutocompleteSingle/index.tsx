import { SelectOption } from "@/core/providers/Form/types";
import { Autocomplete, FormControl, Stack, TextField, Tooltip } from "@mui/material";
import { Info } from "lucide-react";
import { Controller, Path, PathValue } from "react-hook-form";
import { FormAutocompleteSingleProps } from "./types";
import React from "react";

const FormAutocompleteSingleInner = React.forwardRef(
  <TOption extends SelectOption = SelectOption, TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      control,
      defaultValue,
      errors,
      placeholder,
      disabled = false,
      options,
      TextFieldProps = {},
      AutocompleteProps,
      ...props
    }: FormAutocompleteSingleProps<TOption, TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const helperText = hasError ? errorMessage : TextFieldProps?.helperText;

    const originalInputProps = TextFieldProps.InputProps ?? {};
    const userEndAdornment = originalInputProps.endAdornment;

    const mergedInputProps = {
      ...originalInputProps,
      endAdornment: (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {userEndAdornment}
          {tooltipText && (
            <Tooltip title={tooltipText}>
              <Info size={16} />
            </Tooltip>
          )}
        </Stack>
      ),
      helperText,
      error: hasError,
    };

    return (
      <Stack spacing={1}>
        <FormControl fullWidth>
          <Controller
            name={name}
            control={control}
            defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
            render={({ field }) => {
              return (
                <Autocomplete
                  {...AutocompleteProps}
                  options={options}
                  disabled={disabled}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      {...TextFieldProps}
                      inputRef={ref}
                      InputProps={mergedInputProps}
                      variant="standard"
                      label={label}
                      fullWidth
                      style={{ marginTop: 0 }}
                      placeholder={placeholder}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  getOptionLabel={(option) => option.label || ""}
                  onChange={(_event, newValue) => {
                    field.onChange(newValue ? newValue.value : "");
                  }}
                  value={options.find((option) => option.value === field.value) || null}
                />
              );
            }}
            {...props}
          />
        </FormControl>
      </Stack>
    );
  }
);

FormAutocompleteSingleInner.displayName = "FormAutocompleteSingle";

export const FormAutocompleteSingle = FormAutocompleteSingleInner as <
  TOption extends SelectOption = SelectOption,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormAutocompleteSingleProps<TOption, TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
