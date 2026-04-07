import * as React from "react";

import { cn } from "@/core/utils/classname";
import { useScrollFades } from "@/core/hooks/use-scroll-fades";

function TableUI({ className, ...props }: React.ComponentProps<"table">) {
  const { scrollRef, showLeftFade, showRightFade } = useScrollFades<HTMLDivElement>();

  return (
    <div className="relative w-full">
      <div ref={scrollRef} data-slot="table-container" className="w-full overflow-x-auto">
        <table data-slot="table" className={cn("w-full table-fixed caption-bottom text-sm", className)} {...props} />
      </div>
      {showLeftFade && (
        <div className="from-card pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r to-transparent" />
      )}
      {showRightFade && (
        <div className="from-card pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l to-transparent" />
      )}
    </div>
  );
}

function TableHeaderUI({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBodyUI({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooterUI({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-input/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRowUI({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("hover:bg-input/50 data-[state=selected]:bg-input border-b", className)}
      {...props}
    />
  );
}

function TableHeadUI({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCellUI({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
      {...props}
    />
  );
}

function TableCaptionUI({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />
  );
}

export { TableUI, TableHeaderUI, TableBodyUI, TableFooterUI, TableHeadUI, TableRowUI, TableCellUI, TableCaptionUI };
