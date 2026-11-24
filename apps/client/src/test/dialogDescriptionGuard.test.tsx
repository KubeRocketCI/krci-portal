import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/core/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/core/components/ui/sheet";
import { findRadixDialogWarnings } from "./radixWarnings";

// Replaces the console spies of setup.ts so that the expected warnings do not fail the test.
function renderCapturingWarnings(ui: React.ReactElement): string[] {
  const { warn, error } = console;
  const calls: unknown[][] = [];
  const capture = (...args: unknown[]) => {
    calls.push(args);
  };
  console.warn = capture;
  console.error = capture;
  try {
    render(ui);
  } finally {
    console.warn = warn;
    console.error = error;
  }
  return findRadixDialogWarnings(calls);
}

describe("Radix dialog warning guard", () => {
  it("reports a dialog without a description", () => {
    const warnings = renderCapturingWarnings(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(warnings).toHaveLength(1);
  });

  it("reports a dialog without a title", () => {
    const warnings = renderCapturingWarnings(
      <Dialog open>
        <DialogContent aria-describedby={undefined}>Body</DialogContent>
      </Dialog>
    );

    expect(warnings).toHaveLength(1);
  });

  it("reports a sheet without a description", () => {
    const warnings = renderCapturingWarnings(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>
    );

    expect(warnings).toHaveLength(1);
  });

  it("stays quiet for a described dialog and a described sheet", () => {
    const warnings = renderCapturingWarnings(
      <>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
        <Sheet open>
          <SheetContent>
            <SheetTitle>Sheet title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetContent>
        </Sheet>
      </>
    );

    expect(screen.getByText("Dialog description")).toBeInTheDocument();
    expect(warnings).toHaveLength(0);
  });
});
