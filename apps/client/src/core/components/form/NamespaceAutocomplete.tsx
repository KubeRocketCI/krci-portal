import type {
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldAsyncValidateOrFn,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import { Autocomplete as MuiAutocomplete, Chip, FormControl, TextField as MuiTextField } from "@mui/material";

export interface NamespaceAutocompleteProps<
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
> {
  field: FieldApi<
    Values,
    TName,
    DeepValue<Values, TName>,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    never
  >;
  label?: string;
  placeholder?: string;
  options: string[];
}

export const NamespaceAutocomplete = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
>({
  field,
  label,
  placeholder,
  options,
}: NamespaceAutocompleteProps<Values, TName>) => {
  const value = (field.state.value as string[]) ?? [];
  const error = field.state.meta.errors?.[0];
  const hasError = !!error;
  const errorText = hasError ? (error as string) : undefined;

  return (
    <FormControl fullWidth>
      <MuiAutocomplete
        multiple
        value={value}
        onChange={(_event, newValue) => {
          field.handleChange(newValue as never);
        }}
        onBlur={field.handleBlur}
        options={options}
        disableCloseOnSelect
        renderTags={(tagValue, getTagProps) => {
          if (tagValue.length === 0) return null;

          return (
            <>
              <Chip {...getTagProps({ index: 0 })} label={tagValue[0]} size="small" color="primary" />
              {tagValue.length > 1 && (
                <Chip
                  label={`+${tagValue.length - 1}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 0.5 }}
                />
              )}
            </>
          );
        }}
        renderInput={(params) => (
          <MuiTextField
            {...params}
            label={label}
            placeholder={value.length === 0 ? placeholder : undefined}
            error={hasError}
            helperText={errorText}
          />
        )}
      />
    </FormControl>
  );
};
