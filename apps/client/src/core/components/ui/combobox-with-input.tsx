import * as React from "react";
import { Input } from "@/core/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/core/components/ui/command";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { ComboboxOption } from "@/core/components/ui/combobox";

export interface ComboboxWithInputProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
  renderOption?: (option: ComboboxOption) => React.ReactNode;
}

export const ComboboxWithInput = React.forwardRef<HTMLInputElement, ComboboxWithInputProps>(
  (
    {
      value = "",
      onValueChange,
      options,
      placeholder = "Select option...",
      emptyText = "No option found.",
      disabled = false,
      invalid,
      className,
      id,
      renderOption,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value || "");
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Sync inputValue with value prop
    React.useEffect(() => {
      setInputValue(value || "");
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onValueChange?.(newValue);
      // Keep dropdown open when typing
      if (!open) {
        setOpen(true);
      }
    };

    const handleOptionSelect = (optionValue: string) => {
      onValueChange?.(optionValue);
      setInputValue(optionValue);
      setOpen(false);
    };

    // Filter options based on input value
    const availableOptions = React.useMemo(() => {
      if (!inputValue.trim()) {
        return options;
      }

      const searchTerm = inputValue.toLowerCase();
      return options.filter((option) => {
        const valueMatch = option.value.toLowerCase().includes(searchTerm);
        const labelMatch = typeof option.label === "string" ? option.label.toLowerCase().includes(searchTerm) : false;
        return valueMatch || labelMatch;
      });
    }, [options, inputValue]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex w-full items-center" aria-hidden="true">
            <div
              className={cn(
                "bg-muted flex h-9 w-full items-center gap-1 rounded-md border-transparent px-3 text-sm shadow-none transition-[color,box-shadow]",
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
              <Input
                ref={inputRef}
                id={id}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                disabled={disabled}
                invalid={invalid}
                className="min-w-[120px] flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
              <ChevronsUpDownIcon size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0" align="start" sideOffset={4}>
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {availableOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
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
                      <CheckIcon className={cn("ml-auto size-4", isSelected ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

ComboboxWithInput.displayName = "ComboboxWithInput";
