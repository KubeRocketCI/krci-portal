import * as React from "react";
import { Input } from "@/core/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/core/components/ui/command";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { ComboboxOption } from "@/core/components/ui/combobox";
import { filterComboboxOptions, renderComboboxOption } from "@/core/components/ui/combobox/utils";

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
    // In-progress search text while the user is typing. `null` means the user
    // is not typing, so the input mirrors the committed `value` prop directly.
    // Keeping the search text separate from `value` (rather than mirroring the
    // prop into local state) is what lets filtering work even though every
    // keystroke is committed upward via onValueChange.
    const [typingValue, setTypingValue] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const hasUserTyped = typingValue !== null;
    const inputValue = typingValue ?? value;

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen);
      // Closing the popover ends the search: drop the in-progress text so the
      // next open starts from the committed value with the full, unfiltered list.
      if (!nextOpen) {
        setTypingValue(null);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setTypingValue(newValue);
      onValueChange?.(newValue);
      // Keep dropdown open when typing
      if (!open) {
        setOpen(true);
      }
    };

    const handleOptionSelect = (optionValue: string) => {
      setTypingValue(null);
      onValueChange?.(optionValue);
      setOpen(false);
    };

    // Filter options only while the user is actively typing. When viewing a
    // committed/pre-selected value, show the full list so the other options
    // stay reachable.
    const availableOptions = React.useMemo(
      () => (hasUserTyped ? filterComboboxOptions(options, inputValue) : options),
      [options, inputValue, hasUserTyped]
    );

    return (
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <div className="relative flex w-full items-center" aria-hidden="true">
            <div
              className={cn(
                "bg-input flex h-9 w-full items-center gap-1 rounded-md border-transparent px-3 text-sm shadow-none",
                "focus-within:ring-ring/50 focus-within:ring-[3px]",
                invalid && "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
                disabled && "pointer-events-none opacity-50",
                !disabled && "hover:bg-input/50",
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
        <PopoverContent className="z-[1400] w-[var(--radix-popper-anchor-width)] p-0" align="start" sideOffset={4}>
          <Command shouldFilter={false}>
            <CommandList onWheel={(e) => e.stopPropagation()}>
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
                      {renderComboboxOption(option, renderOption)}
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
