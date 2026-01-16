import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/core/utils/classname";

const chipVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive: "border-transparent bg-destructive text-white hover:bg-destructive/90",
        outline: "text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-6 px-2 text-xs",
        small: "h-5 px-1.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const ChipRoot = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span"> & VariantProps<typeof chipVariants>>(
  ({ className, variant, size, ...props }, ref) => {
    return <span ref={ref} data-slot="chip" className={cn(chipVariants({ variant, size }), className)} {...props} />;
  }
);
ChipRoot.displayName = "ChipRoot";

// eslint-disable-next-line react-refresh/only-export-components
export { ChipRoot, chipVariants };

export interface ChipProps extends Omit<React.ComponentProps<"span">, "children"> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "default" | "small";
  children: React.ReactNode;
  onDelete?: () => void;
  avatar?: React.ReactNode;
  className?: string;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ variant = "default", size = "default", children, onDelete, avatar, className, ...props }, ref) => {
    return (
      <ChipRoot ref={ref} variant={variant} size={size} className={className} {...props}>
        {avatar && <span className="flex items-center">{avatar}</span>}
        <span>{children}</span>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Delete"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </ChipRoot>
    );
  }
);

Chip.displayName = "Chip";
