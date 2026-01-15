import * as React from "react";
import { XIcon, ChevronsUpDownIcon } from "lucide-react";
import { Input } from "@/core/components/ui/input";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/core/components/ui/command";
import { cn } from "@/core/utils/classname";
import { ComboboxOption } from "@/core/components/ui/combobox";

export interface ComboboxMultipleWithInputProps {
  value: string[];
  onValueChange?: (value: string[]) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
  maxShownItems?: number;
  getChipLabel?: (value: string, option: ComboboxOption | undefined) => React.ReactNode;
  renderOption?: (option: ComboboxOption) => React.ReactNode;
}

export const ComboboxMultipleWithInput = React.forwardRef<HTMLInputElement, ComboboxMultipleWithInputProps>(
  (
    {
      value = [],
      onValueChange,
      options,
      placeholder = "Type or select namespaces...",
      emptyText = "No option found.",
      disabled = false,
      invalid,
      className,
      id,
      maxShownItems = 2,
      getChipLabel,
      renderOption,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [expanded, setExpanded] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const addValue = (newValue: string) => {
      const trimmedValue = newValue.trim();
      if (trimmedValue && !value.includes(trimmedValue)) {
        onValueChange?.([...value, trimmedValue]);
      }
      setInputValue("");
    };

    const removeValue = (valueToRemove: string) => {
      onValueChange?.(value.filter((v) => v !== valueToRemove));
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        if (inputValue.trim()) {
          addValue(inputValue);
        }
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeValue(value[value.length - 1]);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (!open) {
        setOpen(true);
      }
    };

    const handleOptionSelect = (optionValue: string) => {
      if (!value.includes(optionValue)) {
        onValueChange?.([...value, optionValue]);
      }
      setInputValue("");
      setOpen(false);
    };

    const visibleItems = expanded ? value : value.slice(0, maxShownItems);
    const hiddenCount = value.length - visibleItems.length;

    const availableOptions = React.useMemo(() => {
      const unselectedOptions = options.filter((option) => !value.includes(option.value));

      if (!inputValue.trim()) {
        return unselectedOptions;
      }

      const searchTerm = inputValue.toLowerCase();
      return unselectedOptions.filter((option) => {
        const valueMatch = option.value.toLowerCase().includes(searchTerm);
        const labelMatch = typeof option.label === "string" ? option.label.toLowerCase().includes(searchTerm) : false;
        return valueMatch || labelMatch;
      });
    }, [options, value, inputValue]);

    return (
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div className="relative flex w-full items-center" aria-hidden="true">
            <div
              className={cn(
                "bg-input flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border-transparent px-3 text-sm shadow-none",
                "focus-within:ring-ring/50 focus-within:ring-[3px]",
                invalid && "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
                disabled && "pointer-events-none opacity-50",
                className
              )}
              onClick={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
                if (!open) {
                  setOpen(true);
                }
              }}
            >
              {value.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {visibleItems.map((val) => {
                    const option = options.find((opt) => opt.value === val);
                    // Use custom getChipLabel if provided, otherwise extract text from label or use value
                    const displayLabel = getChipLabel
                      ? getChipLabel(val, option)
                      : typeof option?.label === "string"
                        ? option.label
                        : val;
                    return (
                      <Badge key={val} variant="default" className="normal-case">
                        {displayLabel}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeValue(val);
                          }}
                          asChild
                        >
                          <span>
                            <XIcon className="size-3" />
                          </span>
                        </Button>
                      </Badge>
                    );
                  })}
                  {hiddenCount > 0 && (
                    <Badge
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((prev) => !prev);
                      }}
                    >
                      {expanded ? "Show Less" : `+${hiddenCount} more`}
                    </Badge>
                  )}
                </div>
              )}
              <Input
                ref={inputRef}
                id={id}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setOpen(true)}
                placeholder={value.length === 0 ? placeholder : ""}
                disabled={disabled}
                invalid={invalid}
                className="min-w-[120px] flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
              <ChevronsUpDownIcon size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="z-[1400] w-[var(--radix-popper-anchor-width)] p-0" align="start" sideOffset={4}>
          <Command shouldFilter={false}>
            <CommandList onWheel={(e) => e.stopPropagation()}>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {availableOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => handleOptionSelect(option.value)}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : typeof option.label === "string" ? (
                      <span className="truncate">{option.label}</span>
                    ) : (
                      option.label
                    )}
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

ComboboxMultipleWithInput.displayName = "ComboboxMultipleWithInput";
