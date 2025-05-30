import { SelectOption } from "@/core/providers/Form/types";
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  FormControl,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Check, Info, Plus } from "lucide-react";
import React from "react";
import { Controller, FieldPath, PathValue } from "react-hook-form";
import { FormAutocompleteMultiProps } from "./types";

const FormAutocompleteMultiInner = React.forwardRef(
  <TOption extends SelectOption = SelectOption, TFieldValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      control,
      errors,
      label,
      tooltipText,
      options,
      placeholder,
      defaultValue,
      disabled = false,
      TextFieldProps = {},
      AutocompleteProps,
    }: FormAutocompleteMultiProps<TOption, TFieldValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const theme = useTheme();
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
    };

    return (
      <Stack spacing={1}>
        <FormControl fullWidth>
          <Controller
            name={name}
            control={control}
            defaultValue={defaultValue as PathValue<TFieldValues, FieldPath<TFieldValues>>}
            render={({ field }) => (
              <Autocomplete
                {...AutocompleteProps}
                multiple
                autoComplete
                options={options}
                disabled={disabled}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                getOptionLabel={(option) => option.label || ""}
                renderOption={(props, option, { selected }) => (
                  <li {...props} style={{ height: 36 }}>
                    <Checkbox
                      icon={<Plus />}
                      checkedIcon={<Check />}
                      checked={selected}
                      style={{
                        color: selected ? theme.palette.primary.main : theme.palette.text.primary,
                      }}
                    />
                    {option.label}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...TextFieldProps}
                    inputRef={ref}
                    InputProps={mergedInputProps}
                    variant="standard"
                    label={label}
                    fullWidth
                    placeholder={placeholder}
                    error={hasError}
                    helperText={helperText}
                  />
                )}
                renderTags={(value, getTagProps) => {
                  const limit = 5;
                  return (
                    <>
                      {value.slice(0, limit).map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={index}
                          label={option.label}
                          color="primary"
                          size="small"
                        />
                      ))}
                      {value.length > limit && <Box sx={{ mx: 1 }}>+{value.length - limit}</Box>}
                    </>
                  );
                }}
                value={options.filter((option) =>
                  Array.isArray(field.value) ? field.value.includes(option.value) : false
                )}
                onChange={(_e, newValue) => {
                  field.onChange(newValue.map((opt) => opt.value));
                }}
              />
            )}
          />
        </FormControl>
        {hasError && (
          <Typography component="span" variant="subtitle2" color="error">
            {errorMessage}
          </Typography>
        )}
      </Stack>
    );
  }
);

FormAutocompleteMultiInner.displayName = "FormAutocompleteMulti";

export const FormAutocompleteMulti = FormAutocompleteMultiInner as <
  TOption extends SelectOption = SelectOption,
  TFieldValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormAutocompleteMultiProps<TOption, TFieldValues> & {
    ref?: React.ForwardedRef<HTMLInputElement>;
  }
) => React.JSX.Element;
