import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/core/utils/classname";
import { Button } from "../button";

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn("flex flex-col gap-4", className)} {...props} />;
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        // "bg-card overflow-hidden rounded-lg border border-primary/50 shadow-sm data-[state=open]:border-b-4",
        "bg-card overflow-hidden rounded-lg shadow-sm",

        className
      )}
      {...props}
    />
  );
}

interface AccordionTriggerProps extends React.ComponentProps<typeof AccordionPrimitive.Trigger> {
  hideChevron?: boolean;
  chevronPosition?: "left" | "right";
}

function AccordionTrigger({
  className,
  children,
  hideChevron,
  chevronPosition = "left",
  ...props
}: AccordionTriggerProps) {
  const chevron = !hideChevron && (
    <Button variant="outline" size="sm" className="size-10 shrink-0 p-1" data-slot="accordion-chevron" asChild>
      <span>
        <ChevronRight className="text-muted-foreground size-5 transition-transform duration-200 group-data-[state=open]:hidden" />
        <ChevronDown className="text-muted-foreground hidden size-5 transition-transform duration-200 group-data-[state=open]:block" />
      </span>
    </Button>
  );

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          // "group from-primary/5 to-primary/10 focus-visible:ring-ring/50 flex w-full flex-1 items-center gap-4 border-b border-primary/50 bg-gradient-to-r px-6 py-4 text-left outline-none transition-colors focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",

          "group focus-visible:ring-ring/50 flex w-full flex-1 items-center gap-4 border-b px-6 py-4 text-left transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {chevronPosition === "left" && chevron}
        <div className="flex-1">{children}</div>
        {chevronPosition === "right" && chevron}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("space-y-6 px-6 py-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
