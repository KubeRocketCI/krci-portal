import React from "react";
import type {
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldAsyncValidateOrFn,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import {
  Autocomplete as MuiAutocomplete,
  AutocompleteFreeSoloValueMapping,
  AutocompleteProps as MuiAutocompleteProps,
  AutocompleteValue,
  ChipTypeMap,
  FormControl,
  FormHelperText,
  Stack,
  TextField as MuiTextField,
  Tooltip,
} from "@mui/material";
import { Info } from "lucide-react";

export interface AutocompleteProps<
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
  TOption = string,
  Multiple extends boolean = false,
  DisableClearable extends boolean = false,
  FreeSolo extends boolean = false,
> {
  field: FieldApi<
    Values, // TParentData
    TName, // TName
    DeepValue<Values, TName>, // TData
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnMount
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnChange
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnChangeAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnBlur
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnBlurAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnSubmit
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnSubmitAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnDynamic
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnDynamicAsync
    FormValidateOrFn<Values> | undefined, // TFormOnMount
    FormValidateOrFn<Values> | undefined, // TFormOnChange
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnChangeAsync
    FormValidateOrFn<Values> | undefined, // TFormOnBlur
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnBlurAsync
    FormValidateOrFn<Values> | undefined, // TFormOnSubmit
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnSubmitAsync
    FormValidateOrFn<Values> | undefined, // TFormOnDynamic
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnDynamicAsync
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnServer
    never // TParentSubmitMeta
  >;
  label?: string;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  disabled?: boolean;
  helperText?: string;
  options: TOption[];
  multiple?: Multiple;
  freeSolo?: FreeSolo;
  disableClearable?: DisableClearable;
  getOptionLabel?: (option: TOption | AutocompleteFreeSoloValueMapping<FreeSolo>) => string;
  ChipProps?: ChipTypeMap["props"];
  // Allow passing through other Autocomplete props
  AutocompleteProps?: Partial<
    Omit<
      MuiAutocompleteProps<TOption, Multiple, DisableClearable, FreeSolo>,
      "value" | "onChange" | "onBlur" | "renderInput" | "options"
    >
  >;
}

export const Autocomplete = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
  TOption = string,
  Multiple extends boolean = false,
  DisableClearable extends boolean = false,
  FreeSolo extends boolean = false,
>({
  field,
  label,
  placeholder,
  tooltipText,
  disabled = false,
  helperText,
  options,
  multiple,
  freeSolo,
  disableClearable,
  getOptionLabel,
  ChipProps,
  AutocompleteProps,
}: AutocompleteProps<Values, TName, TOption, Multiple, DisableClearable, FreeSolo>) => {
  const error = field.state.meta.errors?.[0];
  const hasError = !!error;
  const errorText = hasError ? (error as string) : undefined;
  const displayHelperText = errorText || helperText;

  const endAdornment = tooltipText ? (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Tooltip title={tooltipText}>
        <Info size={16} />
      </Tooltip>
    </Stack>
  ) : undefined;

  return (
    <Stack spacing={1}>
      <FormControl fullWidth>
        <MuiAutocomplete
          {...AutocompleteProps}
          value={(field.state.value ?? null) as AutocompleteValue<TOption, Multiple, DisableClearable, FreeSolo>}
          onChange={(_event, newValue) => {
            field.handleChange(newValue as never);
          }}
          onBlur={field.handleBlur}
          options={options}
          disabled={disabled}
          multiple={multiple}
          freeSolo={freeSolo}
          disableClearable={disableClearable}
          getOptionLabel={getOptionLabel}
          ChipProps={ChipProps}
          renderInput={(params) => (
            <MuiTextField
              {...params}
              label={label}
              placeholder={placeholder}
              error={hasError}
              helperText={displayHelperText}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {/* Additional helper text if needed outside of TextField */}
        {!displayHelperText && hasError && <FormHelperText error>{errorText}</FormHelperText>}
      </FormControl>
    </Stack>
  );
};
