import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import React from "react";
import { ComboboxWithInput } from "./index";

const options = [
  { value: "feature/test-184", label: "feature/test-184" },
  { value: "feature/test-1779-2", label: "feature/test-1779-2" },
  { value: "release/1.29", label: "release/1.29" },
  { value: "main", label: "main" },
];

/**
 * Mirrors how the form (FormCombobox → field.handleChange) wires the combobox:
 * every keystroke is committed to the value prop and fed straight back in. This
 * is the exact pattern that previously defeated filtering.
 */
function ControlledCombobox({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = React.useState(initialValue);
  return (
    <ComboboxWithInput value={value} onValueChange={setValue} options={options} placeholder="Select branch name" />
  );
}

function setupCombobox(initialValue = "") {
  const user = userEvent.setup();
  render(<ControlledCombobox initialValue={initialValue} />);
  const input = screen.getByPlaceholderText<HTMLInputElement>("Select branch name");
  return { user, input };
}

function expectFullListVisible() {
  for (const option of options) {
    expect(screen.getByText(option.value)).toBeInTheDocument();
  }
}

describe("ComboboxWithInput", () => {
  it("filters options as the user types, even though each keystroke is committed to value", async () => {
    const { user, input } = setupCombobox();
    await user.click(input);

    // Full list is visible before typing.
    expectFullListVisible();

    await user.type(input, "release");

    // Only the matching option remains — this is the regression guard.
    expect(screen.getByText("release/1.29")).toBeInTheDocument();
    expect(screen.queryByText("feature/test-184")).not.toBeInTheDocument();
    expect(screen.queryByText("feature/test-1779-2")).not.toBeInTheDocument();
    expect(screen.queryByText("main")).not.toBeInTheDocument();
  });

  it("shows the full list (not pre-filtered) when reopening a field that already has a value", async () => {
    const { user, input } = setupCombobox("main");
    await user.click(input);

    // All options stay reachable even though "main" is the committed value.
    expectFullListVisible();
  });

  it("selecting an option commits its value and closes the dropdown", async () => {
    const { user, input } = setupCombobox();
    await user.click(input);
    await user.type(input, "release");
    await user.click(screen.getByText("release/1.29"));

    expect(input.value).toBe("release/1.29");
    // Dropdown is closed: the other options are no longer in the document.
    expect(screen.queryByText("feature/test-184")).not.toBeInTheDocument();
    expect(screen.queryByText("main")).not.toBeInTheDocument();
  });
});
