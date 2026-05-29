import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./index";

// onSubmit re-throws after `finally` when actionCallback rejects (the dialog
// itself does not swallow the error). Vitest tracks unhandled rejections via
// Node's process — jsdom's window event does not suppress it — so silence at
// the process level. Assertions are on dialog state.
const swallow = () => {};

describe("ConfirmDialog onSubmit", () => {
  beforeEach(() => {
    process.on("unhandledRejection", swallow);
  });
  afterEach(() => {
    process.off("unhandledRejection", swallow);
  });

  it("keeps the dialog open and re-enables Confirm when actionCallback rejects", async () => {
    const closeDialog = vi.fn();
    const actionCallback = vi.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        props={{ actionCallback, text: "Are you sure?" }}
        state={{ open: true, closeDialog, openDialog: vi.fn() }}
      />
    );

    await user.type(screen.getByLabelText(/Enter "confirm"/), "confirm");
    const button = screen.getByRole("button", { name: "Confirm" });
    await user.click(button);

    await waitFor(() => expect(actionCallback).toHaveBeenCalledTimes(1));

    // closeDialog stays untouched on the error path so the user can retry from
    // the same dialog without re-typing the magic word.
    expect(closeDialog).not.toHaveBeenCalled();

    // setIsPending(false) ran in `finally`, so the button is enabled again
    // (confirmValue is still "confirm" because the dialog never reset it).
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("closes the dialog when actionCallback resolves", async () => {
    const closeDialog = vi.fn();
    const actionCallback = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        props={{ actionCallback, text: "Are you sure?" }}
        state={{ open: true, closeDialog, openDialog: vi.fn() }}
      />
    );

    await user.type(screen.getByLabelText(/Enter "confirm"/), "confirm");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(actionCallback).toHaveBeenCalledTimes(1));
    expect(closeDialog).toHaveBeenCalledTimes(1);
  });
});
