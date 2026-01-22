import React from "react";
import { useFieldContext } from "../../form-context";
import { extractErrorMessage } from "../../utils/extractErrorMessage";
import { Combobox, ComboboxOption } from "@/core/components/ui/combobox";
import { ComboboxWithInput } from "@/core/components/ui/combobox-with-input";
import { ComboboxMultipleWithInput } from "@/core/components/ui/combobox-multiple-with-input";
import { FormField } from "@/core/components/ui/form-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/core/utils/classname";
import type { SelectOption } from "../../types";

export interface FormComboboxProps<TData = unknown> {
  label?: string;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  helperText?: string;
  disabled?: boolean;
  options: SelectOption[];
  multiple?: boolean;
  freeSolo?: boolean; // Allow free text input (only works with multiple)
  searchPlaceholder?: string;
  emptyText?: string;
  maxShownItems?: number;
  suffix?: React.ReactNode;
  loading?: boolean;

  // Material-UI-style render props
  /**
   * Custom render for each selected chip in the trigger area.
   * Useful for adding icons, badges, or custom styling to chips.
   */
  renderChip?: (params: { value: string; option: SelectOption | undefined; onRemove: () => void }) => React.ReactNode;

  /**
   * Custom render for each option in the dropdown.
   * Useful for adding descriptions, icons, metadata.
   */
  renderOption?: (params: { option: SelectOption; selected: boolean; onSelect: () => void }) => React.ReactNode;

  /**
   * Custom content to render below the combobox.
   * Perfect for showing detailed cards/info about selected items.
   * Only rendered when multiple=true.
   */
  renderSelectedContent?: (params: {
    selectedValues: string[];
    options: SelectOption[];
    data: TData;
    onRemove: (value: string) => void;
  }) => React.ReactNode;

  /**
   * Additional data to pass to render functions
   */
  data?: TData;
}

export const FormCombobox = <TData,>({
  label,
  placeholder = "Select option...",
  tooltipText,
  helperText,
  disabled = false,
  options,
  multiple = false,
  freeSolo = false,
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  maxShownItems = 2,
  suffix,
  loading = false,
  renderChip,
  renderOption,
  renderSelectedContent,
  data,
}: FormComboboxProps<TData>) => {
  // Access field from context
  // For multiple mode, the value is string[], for single mode it's string
  const field = useFieldContext<string | string[]>();

  const [open, setOpen] = React.useState(false);
  const fieldId = React.useId();
  const errors = field.state.meta.errors;
  const isTouched = field.state.meta.isTouched;
  const hasError = isTouched && errors.length > 0;
  const errorMessage = extractErrorMessage(errors);

  // Handler to remove a selected value (for multiple mode)
  const handleRemove = React.useCallback(
    (valueToRemove: string) => {
      if (Array.isArray(field.state.value)) {
        const newValue = field.state.value.filter((v) => v !== valueToRemove);
        field.handleChange(newValue);
      }
    },
    [field]
  );

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

  // Multiple + FreeSolo variant
  if (multiple && freeSolo) {
    const fieldValue = (Array.isArray(field.state.value) ? field.state.value : []) as string[];

    // Convert renderChip to getChipLabel format
    const getChipLabel = renderChip
      ? (value: string, option: ComboboxOption | undefined) => {
          const selectOption = option ? options.find((o) => o.value === option.value) : undefined;
          return renderChip({
            value,
            option: selectOption,
            onRemove: () => handleRemove(value),
          });
        }
      : undefined;

    // Convert renderOption to the expected format
    const adaptedRenderOption = renderOption
      ? (option: ComboboxOption) => {
          const selectOption = options.find((o) => o.value === option.value);
          if (!selectOption) return null;
          const selected = fieldValue.includes(option.value);
          return renderOption({
            option: selectOption,
            selected,
            onSelect: () => {
              const newValue = selected ? fieldValue.filter((v) => v !== option.value) : [...fieldValue, option.value];
              field.handleChange(newValue);
            },
          });
        }
      : undefined;

    return (
      <FormField
        label={label}
        tooltipText={tooltipText}
        error={hasError ? errorMessage : undefined}
        helperText={helperText}
        id={fieldId}
        suffix={suffix}
      >
        <ComboboxMultipleWithInput
          id={fieldId}
          options={comboboxOptions}
          value={fieldValue}
          onValueChange={(value) => {
            if (Array.isArray(value)) {
              field.handleChange(value);
            }
          }}
          placeholder={placeholder}
          emptyText={emptyText}
          disabled={disabled || loading}
          invalid={hasError}
          maxShownItems={maxShownItems}
          getChipLabel={getChipLabel}
          renderOption={adaptedRenderOption}
        />
      </FormField>
    );
  }

  // Multiple variant with custom rendering
  if (multiple && (renderChip || renderOption || renderSelectedContent)) {
    const fieldValue = (Array.isArray(field.state.value) ? field.state.value : []) as string[];

    // Default chip renderer
    const defaultRenderChip = (value: string, option: SelectOption | undefined, onRemove: () => void) => (
      <Badge key={value} className="shrink-0 gap-1.5 pr-1 pl-2">
        {option?.label || value}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-input hover:text-foreground ml-1 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    );

    // Default option renderer
    const defaultRenderOption = (option: SelectOption, selected: boolean, onSelect: () => void) => (
      <CommandItem key={option.value} value={option.value} onSelect={onSelect}>
        <span>{option.label}</span>
        <div
          className={cn(
            "ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            selected ? "bg-primary border-primary" : "border-border"
          )}
        >
          {selected && <Check className="text-primary-foreground h-3 w-3" />}
        </div>
      </CommandItem>
    );

    // Wrapper to convert renderChip signature
    const chipRendererWrapper = renderChip
      ? (value: string, option: SelectOption | undefined, onRemove: () => void) =>
          renderChip({ value, option, onRemove })
      : defaultRenderChip;

    return (
      <>
        <FormField
          label={label}
          tooltipText={tooltipText}
          error={hasError ? errorMessage : undefined}
          helperText={helperText}
          id={fieldId}
          suffix={suffix}
        >
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled || loading}
                className={cn(
                  "h-auto min-h-[42px] w-full justify-between py-2 font-normal",
                  "bg-input text-foreground hover:bg-input hover:text-foreground",
                  hasError && "border-destructive"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {fieldValue.length === 0 ? (
                    <span className="text-muted-foreground">{placeholder}</span>
                  ) : (
                    fieldValue.map((value) => {
                      const option = options.find((o) => o.value === value);
                      return chipRendererWrapper(value, option, () => handleRemove(value));
                    })
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="z-50 w-(--radix-popper-anchor-width) p-0" align="start">
              <Command>
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>{emptyText}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => {
                      const selected = fieldValue.includes(option.value);
                      const optionRenderer = renderOption
                        ? (opt: SelectOption, sel: boolean, onSel: () => void) =>
                            renderOption({ option: opt, selected: sel, onSelect: onSel })
                        : defaultRenderOption;
                      return optionRenderer(option, selected, () => {
                        const newValue = selected
                          ? fieldValue.filter((v) => v !== option.value)
                          : [...fieldValue, option.value];
                        field.handleChange(newValue);
                      });
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FormField>

        {/* Render custom content for selected items */}
        {renderSelectedContent &&
          renderSelectedContent({
            selectedValues: fieldValue,
            options,
            data: data as TData,
            onRemove: handleRemove,
          })}
      </>
    );
  }

  // Multiple variant (without custom rendering, use standard Combobox)
  if (multiple) {
    const fieldValue = (Array.isArray(field.state.value) ? field.state.value : []) as string[];
    return (
      <FormField
        label={label}
        tooltipText={tooltipText}
        error={hasError ? errorMessage : undefined}
        helperText={helperText}
        id={fieldId}
        suffix={suffix}
      >
        <Combobox
          id={fieldId}
          options={comboboxOptions}
          value={fieldValue}
          onValueChange={(value) => {
            if (Array.isArray(value)) {
              field.handleChange(value);
            }
          }}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          disabled={disabled || loading}
          multiple={true}
          maxShownItems={maxShownItems}
        />
      </FormField>
    );
  }

  // Single select with freeSolo (uses ComboboxWithInput)
  if (freeSolo) {
    const fieldValue = (typeof field.state.value === "string" ? field.state.value : "") as string;

    // Convert renderOption to the expected format
    const adaptedRenderOption = renderOption
      ? (option: ComboboxOption) => {
          const selectOption = options.find((o) => o.value === option.value);
          if (!selectOption) return null;
          const selected = fieldValue === option.value;
          return renderOption({
            option: selectOption,
            selected,
            onSelect: () => {
              field.handleChange(option.value);
            },
          });
        }
      : undefined;

    return (
      <FormField
        label={label}
        tooltipText={tooltipText}
        error={hasError ? errorMessage : undefined}
        helperText={helperText}
        id={fieldId}
        suffix={suffix}
      >
        <ComboboxWithInput
          id={fieldId}
          value={fieldValue}
          onValueChange={(value) => {
            field.handleChange(value);
          }}
          options={comboboxOptions}
          placeholder={placeholder}
          emptyText={emptyText}
          disabled={disabled || loading}
          invalid={hasError}
          renderOption={adaptedRenderOption}
        />
      </FormField>
    );
  }

  // Single select (standard)
  const fieldValue = (typeof field.state.value === "string" ? field.state.value : "") as string;
  return (
    <FormField
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={helperText}
      id={fieldId}
      suffix={suffix}
    >
      <Combobox
        id={fieldId}
        options={comboboxOptions}
        value={fieldValue}
        onValueChange={(value) => {
          if (typeof value === "string") {
            field.handleChange(value);
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
};
