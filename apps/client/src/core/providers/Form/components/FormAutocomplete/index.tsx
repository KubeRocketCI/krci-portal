import { SelectOption } from "@/core/providers/Form/types";
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  Checkbox,
  Chip,
  FormControl,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Check, Info, Plus } from "lucide-react";
import React from "react";
import { Controller, FieldValues, FieldPath, PathValue } from "react-hook-form";
import { FormAutocompleteMultiProps } from "./types";

const FormAutocompleteMultiInner = React.forwardRef(
  <TOption extends SelectOption = SelectOption, TFieldValues extends FieldValues = FieldValues>(
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
      ...props
    }: FormAutocompleteMultiProps<TOption, TFieldValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const theme = useTheme();
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const helperText = hasError ? errorMessage : TextFieldProps?.helperText;

    const createMergedInputProps = React.useCallback(
      (inputParams: AutocompleteRenderInputParams) => {
        const originalInputProps = TextFieldProps.InputProps ?? {};
        const userEndAdornment = originalInputProps.endAdornment;
        const autocompleteInputProps = inputParams.InputProps ?? {};

        return {
          ...originalInputProps,
          ...autocompleteInputProps,
          endAdornment: (
            <div className="flex flex-row items-center gap-1">
              {autocompleteInputProps.endAdornment}
              {userEndAdornment}
              {tooltipText && (
                <Tooltip title={tooltipText}>
                  <Info size={16} />
                </Tooltip>
              )}
            </div>
          ),
        };
      },
      [TextFieldProps.InputProps, tooltipText]
    );

    return (
      <div className="flex flex-col gap-2">
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
                renderOption={(props, option, { selected }) => {
                  const { key, ...otherProps } = props as typeof props & { key: string };
                  return (
                    <li key={key} {...otherProps} style={{ height: 36 }}>
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
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...TextFieldProps}
                    inputRef={ref}
                    InputProps={createMergedInputProps(params)}
                    variant="standard"
                    label={label}
                    fullWidth
                    style={{ marginTop: 0 }}
                    placeholder={placeholder}
                    error={hasError || !!TextFieldProps?.error}
                    helperText={helperText}
                  />
                )}
                renderTags={(value, getTagProps) => {
                  const limit = 5;
                  return (
                    <>
                      {value.slice(0, limit).map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return <Chip key={key} {...tagProps} label={option.label} color="primary" size="small" />;
                      })}
                      {value.length > limit && <span className="mx-1">+{value.length - limit}</span>}
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
            {...props}
          />
        </FormControl>
      </div>
    );
  }
);

FormAutocompleteMultiInner.displayName = "FormAutocompleteMulti";

export const FormAutocompleteMulti = FormAutocompleteMultiInner as <
  TOption extends SelectOption = SelectOption,
  TFieldValues extends FieldValues = FieldValues,
>(
  props: FormAutocompleteMultiProps<TOption, TFieldValues> & {
    ref?: React.ForwardedRef<HTMLInputElement>;
  }
) => React.JSX.Element;
