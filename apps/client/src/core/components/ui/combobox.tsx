"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { cn } from "@/core/utils/classname";

export interface ComboboxOption {
  value: string;
  label: string | React.ReactNode;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  multiple?: boolean;
  maxShownItems?: number; // For multi-select, max badges shown before "+N more"
  disabled?: boolean;
  className?: string;
  id?: string;
}

// Single Select Combobox
export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select option...",
      searchPlaceholder = "Search...",
      emptyText = "No option found.",
      multiple = false,
      disabled = false,
      className,
      id,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const singleValue = multiple ? undefined : (value as string | undefined);
    const multiValues = multiple ? (value as string[] | undefined) : undefined;

    const selectedOption = singleValue ? options.find((option) => option.value === singleValue) : undefined;

    if (multiple) {
      return (
        <ComboboxMultiple
          ref={ref}
          options={options}
          value={multiValues || []}
          onValueChange={onValueChange as ((value: string[]) => void) | undefined}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          disabled={disabled}
          className={className}
          id={id}
        />
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("bg-muted w-full justify-between border-transparent py-1 normal-case shadow-none", className)}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0" align="start" sideOffset={4}>
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={(currentValue) => {
                      const newValue = currentValue === singleValue ? "" : currentValue;
                      onValueChange?.(newValue);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon className={cn("size-4", singleValue === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

Combobox.displayName = "Combobox";

// Multi-Select Combobox with Expandable Badges
interface ComboboxMultipleProps {
  options: ComboboxOption[];
  value: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxShownItems?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const ComboboxMultiple = React.forwardRef<HTMLButtonElement, ComboboxMultipleProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select options...",
      searchPlaceholder = "Search...",
      emptyText = "No option found.",
      maxShownItems = 2,
      disabled = false,
      className,
      id,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);

    const toggleSelection = (optionValue: string) => {
      const newValue = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue];
      onValueChange?.(newValue);
    };

    const removeSelection = (optionValue: string) => {
      const newValue = value.filter((v) => v !== optionValue);
      onValueChange?.(newValue);
    };

    const visibleItems = expanded ? value : value.slice(0, maxShownItems);
    const hiddenCount = value.length - visibleItems.length;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "bg-muted h-auto min-h-8 w-full justify-between border-transparent normal-case shadow-none hover:bg-transparent",
              className
            )}
          >
            <div className="flex flex-wrap items-center gap-1 pr-2.5">
              {value.length > 0 ? (
                <>
                  {visibleItems.map((val) => {
                    const option = options.find((opt) => opt.value === val);
                    return option ? (
                      <Badge key={val} variant="default" className="normal-case">
                        {option.label}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelection(val);
                          }}
                          asChild
                        >
                          <span>
                            <XIcon className="size-3" />
                          </span>
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                  {hiddenCount > 0 || expanded ? (
                    <Badge
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((prev) => !prev);
                      }}
                    >
                      {expanded ? "Show Less" : `+${hiddenCount} more`}
                    </Badge>
                  ) : null}
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDownIcon size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0" align="start" sideOffset={4}>
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => toggleSelection(option.value)}
                  >
                    <span className="truncate">{option.label}</span>
                    {value.includes(option.value) && <CheckIcon size={16} className="ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

ComboboxMultiple.displayName = "ComboboxMultiple";
